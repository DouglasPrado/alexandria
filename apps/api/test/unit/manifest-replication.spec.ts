import { Test } from '@nestjs/testing';
import { StorageService } from '../../src/modules/storage/storage.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { VaultService } from '../../src/modules/member/vault.service';
import { SessionKeyService } from '../../src/common/services/session-key.service';

/**
 * Testes de replicacao de manifests nos storage providers.
 * Fonte: docs/blueprint/05-data-model.md (Manifest)
 *
 * Convencao de naming:
 *   Chunks: SHA-256 hash (64 chars hex)
 *   Manifests: manifest:{fileId}
 *   Previews: preview:{fileId}.{format}
 */

const mockPrisma = {
  node: {
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn(),
  },
  manifest: {
    update: jest.fn(),
  },
};

describe('StorageService — Manifest Replication', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VaultService, useValue: { update: jest.fn() } },
        { provide: SessionKeyService, useValue: { get: jest.fn(), store: jest.fn(), clear: jest.fn() } },
      ],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
  });

  describe('replicateManifest()', () => {
    it('should store manifest with manifest:{fileId} naming convention', async () => {
      const mockProvider = {
        put: jest.fn().mockResolvedValue(undefined),
        get: jest.fn(),
        exists: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        capacity: jest.fn(),
      };

      // Register provider manually for test
      (storageService as any).providers.set('node-1', mockProvider);
      (storageService as any).ring.addNode('node-1', 100);

      const manifestData = Buffer.from(JSON.stringify({
        fileId: 'file-uuid-1',
        chunks: [{ chunkId: 'abc', chunkIndex: 0, size: 1024 }],
      }));

      const result = await storageService.replicateManifest('file-uuid-1', manifestData, ['node-1']);

      expect(mockProvider.put).toHaveBeenCalledWith('manifest:file-uuid-1', manifestData);
      expect(result).toContain('node-1');
    });

    it('should update manifest.replicatedTo after successful replication', async () => {
      const mockProvider = {
        put: jest.fn().mockResolvedValue(undefined),
        get: jest.fn(),
        exists: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        capacity: jest.fn(),
      };

      (storageService as any).providers.set('node-1', mockProvider);
      (storageService as any).providers.set('node-2', mockProvider);
      (storageService as any).ring.addNode('node-1', 100);
      (storageService as any).ring.addNode('node-2', 100);

      const manifestData = Buffer.from('test-manifest');

      await storageService.replicateManifest('file-1', manifestData, ['node-1', 'node-2']);

      expect(mockPrisma.manifest.update).toHaveBeenCalledWith({
        where: { fileId: 'file-1' },
        data: { replicatedTo: ['node-1', 'node-2'] },
      });
    });

    it('should handle partial replication failures', async () => {
      const goodProvider = { put: jest.fn().mockResolvedValue(undefined) };
      const badProvider = { put: jest.fn().mockRejectedValue(new Error('Write failed')) };

      (storageService as any).providers.set('node-good', goodProvider);
      (storageService as any).providers.set('node-bad', badProvider);

      const manifestData = Buffer.from('test-manifest');
      const result = await storageService.replicateManifest('file-1', manifestData, ['node-good', 'node-bad']);

      expect(result).toContain('node-good');
      expect(result).not.toContain('node-bad');
    });
  });
});
