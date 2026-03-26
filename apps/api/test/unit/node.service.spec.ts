import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NodeService } from '../../src/modules/node/node.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';

/**
 * Testes do NodeService — registro de nos, heartbeat, drain, listagem.
 * Fonte: docs/backend/06-services.md (NodeService)
 * Fonte: docs/blueprint/04-domain-model.md (RN-N1..N6, RN-C4)
 *
 * - RN-N3: Remocao exige drain obrigatorio
 * - RN-N5: Teste de conectividade no registro
 * - RN-N6: Minimo 3 nos ativos para uploads
 * - RN-C4: Max 50 nos por cluster
 */

const mockPrisma = {
  node: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  chunkReplica: {
    count: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockStorageService = {
  registerNode: jest.fn(),
  unregisterNode: jest.fn(),
  distributeChunks: jest.fn(),
  reReplicateChunk: jest.fn().mockResolvedValue({ targetNodeId: 'node-2', success: true }),
  getProvider: jest.fn(),
  setNodeTier: jest.fn(),
};

describe('NodeService', () => {
  let nodeService: NodeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        NodeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    nodeService = module.get<NodeService>(NodeService);
  });

  describe('register()', () => {
    it('should register a node with status online', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-1',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(100 * 1024 * 1024 * 1024),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));

      const result = await nodeService.register('cluster-1', 'admin-1', {
        name: 'NAS Escritorio',
        type: 's3',
        endpoint: 'https://s3.amazonaws.com',
        bucket: 'alexandria-bucket',
        accessKey: 'AKIA...',
        secretKey: 'wJal...',
        region: 'us-east-1',
      });

      expect(result.name).toBe('NAS Escritorio');
      expect(result.type).toBe('s3');
      expect(result.status).toBe('online');
    });

    it('should register node in StorageService hash ring', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-1',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(100e9),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));

      await nodeService.register('cluster-1', 'admin-1', {
        name: 'S3 Bucket',
        type: 's3',
        endpoint: 'https://s3.amazonaws.com',
        bucket: 'alexandria',
        accessKey: 'AKIA...',
        secretKey: 'secret...',
        region: 'us-east-1',
      });

      expect(mockStorageService.registerNode).toHaveBeenCalledWith(
        'node-1',
        expect.any(Number),
        expect.any(Object), // StorageProvider instance
      );
    });

    it('should create LocalStorageProvider for local type nodes', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-local',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(100e9),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));

      await nodeService.register('cluster-1', 'admin-1', {
        name: 'NAS Local',
        type: 'local',
        endpoint: '/mnt/alexandria/chunks',
      });

      expect(mockStorageService.registerNode).toHaveBeenCalledWith(
        'node-local',
        expect.any(Number),
        expect.any(Object),
      );
    });

    it('should register AWS S3 node without explicit endpoint (derives from region)', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-s3',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(0),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));

      const result = await nodeService.register('cluster-1', 'admin-1', {
        name: 'AWS S3 Node',
        type: 's3',
        bucket: 'my-bucket',
        accessKey: 'AKIASYQG...',
        secretKey: 'e+zjI6B2...',
        region: 'sa-east-1',
      });

      expect(result.type).toBe('s3');
      expect(result.status).toBe('online');
      expect(mockStorageService.registerNode).toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException for R2 node without endpoint', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-r2',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(0),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));

      await expect(
        nodeService.register('cluster-1', 'admin-1', {
          name: 'Bad R2',
          type: 'r2',
          accessKey: 'AKIA...',
          secretKey: 'secret...',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException for S3-compatible node without accessKey', async () => {
      mockPrisma.node.count.mockResolvedValue(3);

      await expect(
        nodeService.register('cluster-1', 'admin-1', {
          name: 'No Creds',
          type: 'r2',
          endpoint: 'https://r2.example.com',
          accessKey: '',
          secretKey: '',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException for S3 node without accessKey', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-s3',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(0),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));

      await expect(
        nodeService.register('cluster-1', 'admin-1', {
          name: 'No Creds S3',
          type: 's3',
          bucket: 'my-bucket',
          region: 'us-east-1',
          accessKey: '',
          secretKey: '',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should allow local node without S3 credentials', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-local',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(0),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));

      const result = await nodeService.register('cluster-1', 'admin-1', {
        name: 'Local NAS',
        type: 'local',
        endpoint: '/mnt/data',
      });

      expect(result.type).toBe('local');
      expect(mockStorageService.registerNode).toHaveBeenCalled();
    });

    it('should query provider capacity and update totalCapacity after registration', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => ({
        id: 'node-cap',
        name: args.data.name,
        type: args.data.type,
        status: 'online',
        totalCapacity: BigInt(0),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      }));
      mockPrisma.node.update.mockResolvedValue({});
      mockStorageService.getProvider.mockReturnValue({
        capacity: jest.fn().mockResolvedValue({
          total: BigInt(200e9),
          used: BigInt(50e9),
        }),
      });

      const result = await nodeService.register('cluster-1', 'admin-1', {
        name: 'NAS com capacidade',
        type: 'local',
        endpoint: '/mnt/data',
      });

      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-cap' },
          data: {
            totalCapacity: BigInt(200e9),
            usedCapacity: BigInt(50e9),
          },
        }),
      );
      expect(result.totalCapacity).toBe(Number(BigInt(200e9)));
      expect(result.usedCapacity).toBe(Number(BigInt(50e9)));
    });

    it('should throw UnprocessableEntityException if cluster has 50 nodes (RN-C4)', async () => {
      mockPrisma.node.count.mockResolvedValue(50);

      await expect(
        nodeService.register('cluster-1', 'admin-1', {
          name: 'Too Many',
          type: 'local',
          endpoint: '/mnt/data',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should encrypt node credentials before storing (RN-N4)', async () => {
      let capturedConfigEncrypted: Buffer | null = null;
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.node.create.mockImplementation((args: any) => {
        capturedConfigEncrypted = args.data.configEncrypted;
        return {
          id: 'node-1',
          name: args.data.name,
          type: args.data.type,
          status: 'online',
          totalCapacity: BigInt(0),
          usedCapacity: BigInt(0),
          lastHeartbeat: new Date(),
          createdAt: new Date(),
        };
      });

      await nodeService.register('cluster-1', 'admin-1', {
        name: 'S3 Node',
        type: 's3',
        endpoint: 'https://s3.amazonaws.com',
        accessKey: 'AKIA_SECRET',
        secretKey: 'super_secret',
      });

      expect(capturedConfigEncrypted).toBeDefined();
      expect(capturedConfigEncrypted instanceof Uint8Array).toBe(true);
      // Config should NOT contain plaintext credentials
      const configStr = Buffer.from(capturedConfigEncrypted!).toString('utf-8');
      expect(configStr).not.toContain('AKIA_SECRET');
      expect(configStr).not.toContain('super_secret');
    });
  });

  describe('heartbeat()', () => {
    it('should update lastHeartbeat and set status to online', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        status: 'suspect',
      });
      mockPrisma.node.update.mockResolvedValue({
        id: 'node-1',
        status: 'online',
        lastHeartbeat: new Date(),
      });

      await nodeService.heartbeat('node-1');

      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-1' },
          data: expect.objectContaining({
            status: 'online',
          }),
        }),
      );
    });

    it('should throw NotFoundException for non-existent node', async () => {
      mockPrisma.node.findUnique.mockResolvedValue(null);

      await expect(nodeService.heartbeat('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should update capacity from storage provider when available', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        status: 'online',
      });
      mockPrisma.node.update.mockResolvedValue({
        id: 'node-1',
        status: 'online',
        lastHeartbeat: new Date(),
      });
      mockStorageService.getProvider.mockReturnValue({
        capacity: jest.fn().mockResolvedValue({
          total: BigInt(500e9),
          used: BigInt(120e9),
        }),
      });

      await nodeService.heartbeat('node-1');

      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-1' },
          data: expect.objectContaining({
            status: 'online',
            totalCapacity: BigInt(500e9),
            usedCapacity: BigInt(120e9),
          }),
        }),
      );
    });

    it('should still update heartbeat when provider is not available', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        status: 'suspect',
      });
      mockPrisma.node.update.mockResolvedValue({
        id: 'node-1',
        status: 'online',
        lastHeartbeat: new Date(),
      });
      mockStorageService.getProvider.mockReturnValue(undefined);

      await nodeService.heartbeat('node-1');

      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-1' },
          data: expect.objectContaining({
            status: 'online',
          }),
        }),
      );
    });
  });

  describe('listByCluster()', () => {
    it('should return list of nodes with chunk counts', async () => {
      mockPrisma.node.findMany.mockResolvedValue([
        {
          id: 'n1',
          name: 'NAS',
          type: 'local',
          status: 'online',
          totalCapacity: BigInt(100e9),
          usedCapacity: BigInt(30e9),
          lastHeartbeat: new Date(),
          createdAt: new Date(),
          _count: { chunkReplicas: 42 },
        },
      ]);

      const result = await nodeService.listByCluster('cluster-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('NAS');
    });
  });

  describe('drain()', () => {
    it('should migrate chunks, set status to disconnected, and unregister from ring', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        clusterId: 'cluster-1',
        status: 'online',
      });
      mockPrisma.node.count.mockResolvedValue(4);
      // Node has 2 chunks to migrate
      mockPrisma.chunkReplica.findMany.mockResolvedValue([
        { id: 'r1', chunkId: 'chunk-a', nodeId: 'node-1', status: 'healthy' },
        { id: 'r2', chunkId: 'chunk-b', nodeId: 'node-1', status: 'healthy' },
      ]);
      // Each chunk has < 3 active replicas on other nodes
      mockPrisma.chunkReplica.count.mockResolvedValue(1);
      mockPrisma.node.update.mockResolvedValue({ id: 'node-1', status: 'disconnected' });
      mockPrisma.chunkReplica.deleteMany.mockResolvedValue({ count: 2 });

      const result = await nodeService.drain('node-1');

      // Should set status to draining, then disconnected
      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-1' },
          data: expect.objectContaining({ status: 'draining' }),
        }),
      );
      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-1' },
          data: expect.objectContaining({ status: 'disconnected' }),
        }),
      );
      // Should re-replicate chunks
      expect(mockStorageService.reReplicateChunk).toHaveBeenCalledTimes(2);
      expect(mockStorageService.reReplicateChunk).toHaveBeenCalledWith('chunk-a', ['node-1']);
      expect(mockStorageService.reReplicateChunk).toHaveBeenCalledWith('chunk-b', ['node-1']);
      // Should remove replicas from drained node
      expect(mockPrisma.chunkReplica.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { nodeId: 'node-1' } }),
      );
      // Should unregister from ring
      expect(mockStorageService.unregisterNode).toHaveBeenCalledWith('node-1');
      // Should return final status
      expect(result.status).toBe('disconnected');
      expect(result.chunksRelocated).toBe(2);
    });

    it('should skip re-replication for chunks already with 3+ replicas', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        clusterId: 'cluster-1',
        status: 'online',
      });
      mockPrisma.node.count.mockResolvedValue(4);
      mockPrisma.chunkReplica.findMany.mockResolvedValue([
        { id: 'r1', chunkId: 'chunk-a', nodeId: 'node-1', status: 'healthy' },
      ]);
      // Chunk already has 3 active replicas elsewhere
      mockPrisma.chunkReplica.count.mockResolvedValue(3);
      mockPrisma.node.update.mockResolvedValue({ id: 'node-1', status: 'disconnected' });
      mockPrisma.chunkReplica.deleteMany.mockResolvedValue({ count: 1 });

      const result = await nodeService.drain('node-1');

      expect(mockStorageService.reReplicateChunk).not.toHaveBeenCalled();
      expect(result.chunksRelocated).toBe(0);
      expect(result.chunksSkipped).toBe(1);
      expect(result.status).toBe('disconnected');
    });

    it('should throw NotFoundException for non-existent node', async () => {
      mockPrisma.node.findUnique.mockResolvedValue(null);

      await expect(nodeService.drain('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if drain would leave < MIN_NODES nodes (RN-N6)', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        clusterId: 'cluster-1',
        status: 'online',
      });
      // Default MIN_NODES_FOR_REPLICATION=1, so 1 active node = cannot drain
      mockPrisma.node.count.mockResolvedValue(1);

      await expect(nodeService.drain('node-1')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('remove()', () => {
    it('should remove a drained node', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        status: 'disconnected',
      });
      mockPrisma.node.delete.mockResolvedValue({});

      await expect(nodeService.remove('node-1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException for non-existent node', async () => {
      mockPrisma.node.findUnique.mockResolvedValue(null);

      await expect(nodeService.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if node is not drained (RN-N3)', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        status: 'online', // not drained
      });

      await expect(nodeService.remove('node-1')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('setTier()', () => {
    /**
     * Tiered storage — Fase 2.
     * Tiers validos: hot | warm | cold.
     * setTier atualiza o tier do no no banco e no StorageService.
     * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Tiered storage)
     */

    it('should update node tier to hot (TIER-1)', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        clusterId: 'cluster-1',
        tier: 'warm',
      });
      mockPrisma.node.update.mockResolvedValue({ id: 'node-1', tier: 'hot' });

      const result = await nodeService.setTier('node-1', 'cluster-1', 'hot');

      expect(result.tier).toBe('hot');
      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tier: 'hot' }),
        }),
      );
      expect(mockStorageService.setNodeTier).toHaveBeenCalledWith('node-1', 'hot');
    });

    it('should update node tier to cold (TIER-2)', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        clusterId: 'cluster-1',
        tier: 'warm',
      });
      mockPrisma.node.update.mockResolvedValue({ id: 'node-1', tier: 'cold' });

      const result = await nodeService.setTier('node-1', 'cluster-1', 'cold');

      expect(result.tier).toBe('cold');
    });

    it('should throw BadRequestException for invalid tier (TIER-3)', async () => {
      await expect(
        nodeService.setTier('node-1', 'cluster-1', 'turbo'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.node.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if node not found or belongs to different cluster (TIER-4)', async () => {
      mockPrisma.node.findUnique.mockResolvedValue(null);

      await expect(
        nodeService.setTier('non-existent', 'cluster-1', 'hot'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
