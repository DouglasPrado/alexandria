import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NodeService } from '../../src/modules/node/node.service';
import { PrismaService } from '../../src/prisma/prisma.service';

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
  },
};

describe('NodeService', () => {
  let nodeService: NodeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        NodeService,
        { provide: PrismaService, useValue: mockPrisma },
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
      expect(Buffer.isBuffer(capturedConfigEncrypted)).toBe(true);
      // Config should NOT contain plaintext credentials
      const configStr = capturedConfigEncrypted!.toString('utf-8');
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
    it('should set node status to draining', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        clusterId: 'cluster-1',
        status: 'online',
      });
      mockPrisma.node.count.mockResolvedValue(4); // 4 nodes, 3 remain after drain
      mockPrisma.chunkReplica.count.mockResolvedValue(100);
      mockPrisma.node.update.mockResolvedValue({
        id: 'node-1',
        status: 'draining',
      });

      const result = await nodeService.drain('node-1');

      expect(result.status).toBe('draining');
      expect(result.chunksToMigrate).toBe(100);
    });

    it('should throw NotFoundException for non-existent node', async () => {
      mockPrisma.node.findUnique.mockResolvedValue(null);

      await expect(nodeService.drain('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if drain would leave < 3 nodes (RN-N6)', async () => {
      mockPrisma.node.findUnique.mockResolvedValue({
        id: 'node-1',
        clusterId: 'cluster-1',
        status: 'online',
      });
      mockPrisma.node.count.mockResolvedValue(3); // only 3, draining one leaves 2

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
});
