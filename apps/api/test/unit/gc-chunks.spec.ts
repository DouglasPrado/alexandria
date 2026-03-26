import { Test } from '@nestjs/testing';
import { HealthService } from '../../src/modules/health/health.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Testes de Garbage Collection — remocao de chunks orfaos.
 * Fonte: docs/backend/06-services.md (HealthService.garbageCollect)
 * Fonte: docs/backend/12-events.md (GarbageCollection — diario as 04:00)
 *
 * Chunk orfao: referenceCount = 0 (nenhum manifest referencia).
 * Fluxo:
 * 1. Query chunks WHERE reference_count = 0
 * 2. Para cada: deletar replicas dos nos via StorageProvider
 * 3. Deletar registros de chunk_replicas e chunks do banco
 */

const mockPrisma = {
  chunk: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  chunkReplica: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  alert: {
    create: jest.fn().mockImplementation((args: any) => ({
      id: 'alert-gc',
      ...args.data,
      createdAt: new Date(),
      resolvedAt: null,
    })),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  node: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  manifestChunk: {
    findFirst: jest.fn().mockResolvedValue(null),
  },
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
};

const mockStorageService = {
  getFromNode: jest.fn(),
  storeInNode: jest.fn(),
  reReplicateChunk: jest.fn(),
  deleteFromNode: jest.fn(),
  registerNode: jest.fn(),
  unregisterNode: jest.fn(),
};

describe('Garbage Collection', () => {
  let healthService: HealthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    healthService = module.get<HealthService>(HealthService);
  });

  describe('garbageCollect()', () => {
    it('should delete orphan chunks with referenceCount = 0', async () => {
      mockPrisma.chunk.findMany.mockResolvedValueOnce([
        { id: 'chunk-orphan-1', size: 4000000, referenceCount: 0 },
        { id: 'chunk-orphan-2', size: 3500000, referenceCount: 0 },
      ]);

      // Replicas for orphan chunks
      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-orphan-1', nodeId: 'node-1' },
        { id: 'r2', chunkId: 'chunk-orphan-1', nodeId: 'node-2' },
        { id: 'r3', chunkId: 'chunk-orphan-2', nodeId: 'node-1' },
      ]);

      mockStorageService.deleteFromNode.mockResolvedValue(undefined);
      mockPrisma.chunkReplica.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.chunk.deleteMany.mockResolvedValue({ count: 2 });

      const result = await healthService.garbageCollect();

      expect(result.chunksRemoved).toBe(2);
      expect(result.replicasRemoved).toBe(3);
      expect(result.spaceFreed).toBe(7500000);
    });

    it('should delete chunk data from storage nodes', async () => {
      mockPrisma.chunk.findMany.mockResolvedValueOnce([
        { id: 'chunk-aaa', size: 1000, referenceCount: 0 },
      ]);

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-aaa', nodeId: 'node-1' },
        { id: 'r2', chunkId: 'chunk-aaa', nodeId: 'node-2' },
      ]);

      mockStorageService.deleteFromNode.mockResolvedValue(undefined);
      mockPrisma.chunkReplica.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.chunk.deleteMany.mockResolvedValue({ count: 1 });

      await healthService.garbageCollect();

      // Should call deleteFromNode for each replica
      expect(mockStorageService.deleteFromNode).toHaveBeenCalledTimes(2);
      expect(mockStorageService.deleteFromNode).toHaveBeenCalledWith('node-1', 'chunk-aaa');
      expect(mockStorageService.deleteFromNode).toHaveBeenCalledWith('node-2', 'chunk-aaa');
    });

    it('should not delete chunks with referenceCount > 0', async () => {
      // No orphan chunks found
      mockPrisma.chunk.findMany.mockResolvedValueOnce([]);

      const result = await healthService.garbageCollect();

      expect(result.chunksRemoved).toBe(0);
      expect(result.replicasRemoved).toBe(0);
      expect(result.spaceFreed).toBe(0);
      expect(mockStorageService.deleteFromNode).not.toHaveBeenCalled();
    });

    it('should handle deleteFromNode failures gracefully', async () => {
      mockPrisma.chunk.findMany.mockResolvedValueOnce([
        { id: 'chunk-aaa', size: 2000, referenceCount: 0 },
      ]);

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-aaa', nodeId: 'node-offline' },
      ]);

      // Node offline — deleteFromNode fails
      mockStorageService.deleteFromNode.mockRejectedValueOnce(new Error('Node offline'));
      mockPrisma.chunkReplica.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.chunk.deleteMany.mockResolvedValue({ count: 1 });

      // Should not throw — GC continues
      const result = await healthService.garbageCollect();

      expect(result.chunksRemoved).toBe(1);
    });

    it('should return GCResult with all counters', async () => {
      mockPrisma.chunk.findMany.mockResolvedValueOnce([]);

      const result = await healthService.garbageCollect();

      expect(result).toEqual(
        expect.objectContaining({
          chunksRemoved: expect.any(Number),
          replicasRemoved: expect.any(Number),
          spaceFreed: expect.any(Number),
        }),
      );
    });
  });
});
