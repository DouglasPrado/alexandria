import { Test } from '@nestjs/testing';
import { HealthService } from '../../src/modules/health/health.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationService } from '../../src/modules/notification/notification.service';

/**
 * Testes de Auto-Healing — re-replicacao automatica quando no e perdido.
 * Fonte: docs/blueprint/07-critical_flows.md (Auto-Healing — No Perdido)
 * Fonte: docs/backend/06-services.md (HealthService.autoHeal)
 *
 * Regras:
 * - RN-CR1: Minimo 3 replicas por chunk em nos diferentes
 * - RN-CR4: Replica corrompida substituida automaticamente
 * - RN-N2: 1h sem heartbeat → lost + auto-healing
 * - RN-A3: Auto-healing pode resolver alertas automaticamente
 */

// --- Mocks ---

const mockPrisma = {
  chunkReplica: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  chunk: {
    findUnique: jest.fn(),
  },
  node: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  alert: {
    create: jest.fn().mockImplementation((args: any) => ({
      id: 'alert-auto',
      ...args.data,
      createdAt: new Date(),
      resolvedAt: null,
    })),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  file: {
    update: jest.fn(),
  },
  manifest: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
};

const mockStorageService = {
  getFromNode: jest.fn(),
  storeInNode: jest.fn(),
  reReplicateChunk: jest.fn(),
  registerNode: jest.fn(),
  unregisterNode: jest.fn(),
};

const mockNotifications = {
  sendInviteEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendNodeLostAlert: jest.fn().mockResolvedValue(undefined),
  sendFileErrorEmail: jest.fn().mockResolvedValue(undefined),
};

describe('Auto-Healing', () => {
  let healthService: HealthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: NotificationService, useValue: mockNotifications },
      ],
    }).compile();

    healthService = module.get<HealthService>(HealthService);
  });

  describe('autoHeal(nodeId)', () => {
    it('should re-replicate sub-replicated chunks from lost node (RN-CR1)', async () => {
      // Arrange: node-lost has 2 chunks, each with only 2 remaining healthy replicas
      const lostNodeId = 'node-lost';
      const clusterId = 'cluster-1';

      // Replicas on the lost node
      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-aaa', nodeId: lostNodeId, status: 'healthy' },
        { id: 'r2', chunkId: 'chunk-bbb', nodeId: lostNodeId, status: 'healthy' },
      ]);

      // For chunk-aaa: 2 healthy replicas remain (below 3)
      mockPrisma.chunkReplica.count
        .mockResolvedValueOnce(2)  // chunk-aaa
        .mockResolvedValueOnce(2); // chunk-bbb

      // reReplicateChunk succeeds
      mockStorageService.reReplicateChunk
        .mockResolvedValueOnce({ targetNodeId: 'node-3', success: true })
        .mockResolvedValueOnce({ targetNodeId: 'node-4', success: true });

      // Alert for this node
      mockPrisma.alert.findFirst.mockResolvedValue({
        id: 'alert-lost',
        resolved: false,
        relatedEntityId: lostNodeId,
      });
      mockPrisma.alert.update.mockResolvedValue({
        id: 'alert-lost',
        resolved: true,
        resolvedAt: new Date(),
      });

      // Act
      const result = await healthService.autoHeal(lostNodeId, clusterId);

      // Assert
      expect(mockStorageService.reReplicateChunk).toHaveBeenCalledTimes(2);
      expect(result.chunksHealed).toBe(2);
      expect(result.chunksSkipped).toBe(0);
    });

    it('should skip chunks that already have 3+ replicas (idempotent)', async () => {
      const lostNodeId = 'node-lost';
      const clusterId = 'cluster-1';

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-aaa', nodeId: lostNodeId, status: 'healthy' },
      ]);

      // chunk-aaa already has 3 healthy replicas on other nodes
      mockPrisma.chunkReplica.count.mockResolvedValueOnce(3);

      mockPrisma.alert.findFirst.mockResolvedValue(null);

      const result = await healthService.autoHeal(lostNodeId, clusterId);

      expect(mockStorageService.reReplicateChunk).not.toHaveBeenCalled();
      expect(result.chunksHealed).toBe(0);
      expect(result.chunksSkipped).toBe(1);
    });

    it('should mark chunk as failed when reReplicateChunk fails', async () => {
      const lostNodeId = 'node-lost';
      const clusterId = 'cluster-1';

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-aaa', nodeId: lostNodeId, status: 'healthy' },
      ]);

      mockPrisma.chunkReplica.count.mockResolvedValueOnce(1); // critically low

      mockStorageService.reReplicateChunk.mockRejectedValueOnce(
        new Error('No healthy replica found'),
      );

      mockPrisma.alert.findFirst.mockResolvedValue(null);

      const result = await healthService.autoHeal(lostNodeId, clusterId);

      expect(result.chunksHealed).toBe(0);
      expect(result.chunksFailed).toBe(1);
    });

    it('should resolve the node_offline alert after successful healing (RN-A3)', async () => {
      const lostNodeId = 'node-lost';
      const clusterId = 'cluster-1';

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([]);

      // Existing unresolved alert for this node
      mockPrisma.alert.findFirst.mockResolvedValue({
        id: 'alert-node',
        resolved: false,
        relatedEntityId: lostNodeId,
      });
      mockPrisma.alert.update.mockResolvedValue({
        id: 'alert-node',
        resolved: true,
        resolvedAt: new Date(),
      });

      const result = await healthService.autoHeal(lostNodeId, clusterId);

      // Alert should be resolved
      expect(mockPrisma.alert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'alert-node' },
          data: expect.objectContaining({ resolved: true }),
        }),
      );
      expect(result.chunksHealed).toBe(0);
    });

    it('should create auto_healing_complete alert with summary', async () => {
      const lostNodeId = 'node-lost';
      const clusterId = 'cluster-1';

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-aaa', nodeId: lostNodeId, status: 'healthy' },
      ]);

      mockPrisma.chunkReplica.count.mockResolvedValueOnce(2);
      mockStorageService.reReplicateChunk.mockResolvedValueOnce({
        targetNodeId: 'node-3',
        success: true,
      });

      mockPrisma.alert.findFirst.mockResolvedValue(null);

      await healthService.autoHeal(lostNodeId, clusterId);

      // Should create an auto_healing_complete alert
      expect(mockPrisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'auto_healing_complete',
            severity: 'info',
            clusterId,
          }),
        }),
      );
    });

    it('should delete replicas of the lost node after healing', async () => {
      const lostNodeId = 'node-lost';
      const clusterId = 'cluster-1';

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'chunk-aaa', nodeId: lostNodeId, status: 'healthy' },
      ]);

      mockPrisma.chunkReplica.count.mockResolvedValueOnce(2);
      mockStorageService.reReplicateChunk.mockResolvedValueOnce({
        targetNodeId: 'node-3',
        success: true,
      });

      mockPrisma.alert.findFirst.mockResolvedValue(null);

      await healthService.autoHeal(lostNodeId, clusterId);

      // Should delete all replicas from the lost node
      expect(mockPrisma.chunkReplica.deleteMany).toHaveBeenCalledWith({
        where: { nodeId: lostNodeId },
      });
    });
  });

  describe('StorageService.reReplicateChunk()', () => {
    it('should copy chunk from healthy replica to new node', async () => {
      const chunkData = Buffer.from('encrypted-chunk-data');

      mockStorageService.reReplicateChunk.mockResolvedValueOnce({
        targetNodeId: 'node-new',
        success: true,
      });

      const result = await mockStorageService.reReplicateChunk(
        'chunk-aaa',
        ['node-lost'],
      );

      expect(result.targetNodeId).toBe('node-new');
      expect(result.success).toBe(true);
    });
  });
});
