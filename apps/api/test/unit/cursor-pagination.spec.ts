import { Test } from '@nestjs/testing';
import { MemberService } from '../../src/modules/member/member.service';
import { NodeService } from '../../src/modules/node/node.service';
import { HealthService } from '../../src/modules/health/health.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { NotificationService } from '../../src/modules/notification/notification.service';
import { VaultService } from '../../src/modules/member/vault.service';
import { SessionKeyService } from '../../src/common/services/session-key.service';
import { JwtService } from '@nestjs/jwt';

/**
 * Testes de cursor pagination em listagens.
 * Fonte: docs/backend/05-api-contracts.md (cursor-based: ?cursor=&limit=20 → { data, meta: { cursor, hasMore } })
 */

const mockPrisma = {
  member: { findMany: jest.fn(), count: jest.fn() },
  node: { findMany: jest.fn(), count: jest.fn() },
  alert: { findMany: jest.fn() },
};

const makeMember = (id: string, i: number) => ({
  id,
  name: `Member ${i}`,
  email: `m${i}@test.com`,
  role: 'member',
  clusterId: 'cluster-1',
  joinedAt: new Date(),
});

const makeNode = (id: string, i: number) => ({
  id,
  name: `Node ${i}`,
  type: 'local',
  status: 'online',
  totalCapacity: BigInt(100e9),
  usedCapacity: BigInt(0),
  lastHeartbeat: new Date(),
  createdAt: new Date(),
  _count: { chunkReplicas: 0 },
});

const makeAlert = (id: string, i: number) => ({
  id,
  type: 'node_offline',
  severity: 'warning',
  message: `Alert ${i}`,
  relatedEntityId: null,
  resolved: false,
  clusterId: 'cluster-1',
  createdAt: new Date(),
  resolvedAt: null,
});

describe('Cursor Pagination', () => {
  describe('MemberService.listByCluster()', () => {
    let memberService: MemberService;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module = await Test.createTestingModule({
        providers: [
          MemberService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: JwtService, useValue: {} },
          { provide: NotificationService, useValue: {} },
        ],
      }).compile();
      memberService = module.get(MemberService);
    });

    it('should return { data, meta: { cursor, hasMore } } format', async () => {
      const members = [makeMember('m1', 1), makeMember('m2', 2)];
      mockPrisma.member.findMany.mockResolvedValue(members);

      const result = await memberService.listByCluster('cluster-1', { limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('cursor');
      expect(result.meta).toHaveProperty('hasMore');
    });

    it('should respect limit parameter', async () => {
      mockPrisma.member.findMany.mockResolvedValue([makeMember('m1', 1)]);

      await memberService.listByCluster('cluster-1', { limit: 1 });

      expect(mockPrisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }), // take limit+1 to check hasMore
      );
    });

    it('should set hasMore=true when more items exist', async () => {
      // Return 3 items when limit is 2 (take=3)
      mockPrisma.member.findMany.mockResolvedValue([
        makeMember('m1', 1),
        makeMember('m2', 2),
        makeMember('m3', 3),
      ]);

      const result = await memberService.listByCluster('cluster-1', { limit: 2 });

      expect(result.meta.hasMore).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.meta.cursor).toBe('m2');
    });

    it('should set hasMore=false when no more items', async () => {
      mockPrisma.member.findMany.mockResolvedValue([makeMember('m1', 1)]);

      const result = await memberService.listByCluster('cluster-1', { limit: 20 });

      expect(result.meta.hasMore).toBe(false);
    });

    it('should use cursor for pagination', async () => {
      mockPrisma.member.findMany.mockResolvedValue([]);

      await memberService.listByCluster('cluster-1', { cursor: 'm1', limit: 20 });

      expect(mockPrisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'm1' },
          skip: 1,
        }),
      );
    });
  });

  describe('NodeService.listByCluster()', () => {
    let nodeService: NodeService;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module = await Test.createTestingModule({
        providers: [
          NodeService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: StorageService, useValue: {} },
          { provide: VaultService, useValue: {} },
          { provide: SessionKeyService, useValue: { get: jest.fn() } },
        ],
      }).compile();
      nodeService = module.get(NodeService);
    });

    it('should return paginated format', async () => {
      mockPrisma.node.findMany.mockResolvedValue([makeNode('n1', 1)]);

      const result = await nodeService.listByCluster('cluster-1', { limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('cursor');
      expect(result.meta).toHaveProperty('hasMore');
    });

    it('should filter by status when provided', async () => {
      mockPrisma.node.findMany.mockResolvedValue([]);

      await nodeService.listByCluster('cluster-1', { limit: 20, status: 'online' });

      expect(mockPrisma.node.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'online' }),
        }),
      );
    });
  });

  describe('HealthService.listAlerts()', () => {
    let healthService: HealthService;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module = await Test.createTestingModule({
        providers: [
          HealthService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: StorageService, useValue: {} },
          { provide: NotificationService, useValue: {} },
        ],
      }).compile();
      healthService = module.get(HealthService);
    });

    it('should return paginated format', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([makeAlert('a1', 1)]);

      const result = await healthService.listAlerts('cluster-1', { limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });
});
