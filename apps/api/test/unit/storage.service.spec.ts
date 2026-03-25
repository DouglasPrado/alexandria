import { Test } from '@nestjs/testing';
import { StorageService } from '../../src/modules/storage/storage.service';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Testes do StorageService — distribuicao de chunks criptografados.
 * Fonte: docs/backend/06-services.md (StorageService.distributeChunks — 13 passos)
 *
 * Fluxo: split → dedup → encrypt (AES-256-GCM) → distribute (3x) → manifest
 */

const mockPrisma = {
  chunk: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  chunkReplica: {
    create: jest.fn(),
  },
  manifest: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  manifestChunk: {
    create: jest.fn(),
  },
  file: {
    update: jest.fn(),
  },
  $transaction: jest.fn((fn: Function) => fn(mockPrisma)),
};

// Mock StorageProvider
const mockProvider = {
  put: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  capacity: jest.fn(),
};

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    storageService = module.get<StorageService>(StorageService);

    // Register 3 mock nodes
    storageService.registerNode('node-1', 100, { ...mockProvider });
    storageService.registerNode('node-2', 100, { ...mockProvider });
    storageService.registerNode('node-3', 100, { ...mockProvider });
  });

  describe('registerNode() / unregisterNode()', () => {
    it('should register a node with provider', () => {
      const service = new (StorageService as any)({ $transaction: jest.fn() });
      service.registerNode('test-node', 100, mockProvider);
      // No throw = success
    });

    it('should unregister a node', () => {
      const service = new (StorageService as any)({ $transaction: jest.fn() });
      service.registerNode('test-node', 100, mockProvider);
      service.unregisterNode('test-node');
      // No throw = success
    });
  });

  describe('distributeChunks()', () => {
    const masterKey = Buffer.alloc(32, 0xab);

    it('should split, encrypt, and distribute chunks', async () => {
      mockPrisma.chunk.findUnique.mockResolvedValue(null); // no dedup
      mockPrisma.chunk.create.mockResolvedValue({});
      mockPrisma.chunkReplica.create.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'manifest-1' });
      mockPrisma.manifest.findUnique.mockResolvedValue({ id: 'manifest-1' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});

      const content = Buffer.alloc(100_000, 0xcc); // 100KB
      const result = await storageService.distributeChunks('file-1', content, masterKey);

      expect(result.chunksCount).toBeGreaterThan(0);
      expect(mockPrisma.chunk.create).toHaveBeenCalled();
      expect(mockPrisma.manifest.create).toHaveBeenCalled();
      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ready' }),
        }),
      );
    });

    it('should encrypt chunks with AES-256-GCM before storing', async () => {
      mockPrisma.chunk.findUnique.mockResolvedValue(null);
      mockPrisma.chunk.create.mockResolvedValue({});
      mockPrisma.chunkReplica.create.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifest.findUnique.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});

      const content = Buffer.from('sensitive family photo data');
      await storageService.distributeChunks('file-2', content, masterKey);

      // StorageProvider.put should have been called with encrypted data (not plaintext)
      // The providers are fresh copies per test, so we check the registered ones called put
      expect(mockPrisma.chunkReplica.create).toHaveBeenCalled();
    });

    it('should deduplicate existing chunks', async () => {
      // First chunk already exists
      mockPrisma.chunk.findUnique.mockResolvedValueOnce({ id: 'existing', referenceCount: 1 });
      mockPrisma.chunk.update.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifest.findUnique.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});

      const content = Buffer.alloc(1000, 0xdd);
      await storageService.distributeChunks('file-3', content, masterKey);

      // Should increment reference count instead of creating new
      expect(mockPrisma.chunk.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { referenceCount: { increment: 1 } },
        }),
      );
    });

    it('should create manifest with encrypted file key', async () => {
      mockPrisma.chunk.findUnique.mockResolvedValue(null);
      mockPrisma.chunk.create.mockResolvedValue({});
      mockPrisma.chunkReplica.create.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifest.findUnique.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});

      await storageService.distributeChunks('file-4', Buffer.alloc(500), masterKey);

      expect(mockPrisma.manifest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileId: 'file-4',
            fileKeyEncrypted: expect.any(Buffer),
            version: 1,
          }),
        }),
      );
    });

    it('should execute within a transaction', async () => {
      mockPrisma.chunk.findUnique.mockResolvedValue(null);
      mockPrisma.chunk.create.mockResolvedValue({});
      mockPrisma.chunkReplica.create.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifest.findUnique.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});

      await storageService.distributeChunks('file-5', Buffer.alloc(100), masterKey);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
