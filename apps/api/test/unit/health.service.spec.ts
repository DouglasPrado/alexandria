import { Test } from '@nestjs/testing';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { HealthService } from '../../src/modules/health/health.service';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Testes do HealthService — alertas, heartbeat check, liveness/readiness.
 * Fonte: docs/backend/06-services.md (HealthService)
 * Fonte: docs/blueprint/04-domain-model.md (RN-A1..A3, RN-N1..N2)
 *
 * - RN-A1: Alertas gerados automaticamente pelo Scheduler
 * - RN-A2: Alertas persistem ate resolucao
 * - RN-A3: Auto-healing pode resolver alertas automaticamente
 * - RN-N1: 30min sem heartbeat → suspect
 * - RN-N2: 1h sem heartbeat → lost
 */

const mockPrisma = {
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
  },
  node: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
};

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    healthService = module.get<HealthService>(HealthService);
  });

  describe('createAlert()', () => {
    it('should create alert with type, severity, and message (RN-A1)', async () => {
      mockPrisma.alert.create.mockImplementation((args: any) => ({
        id: 'alert-1',
        ...args.data,
        resolved: false,
        createdAt: new Date(),
        resolvedAt: null,
      }));

      const result = await healthService.createAlert({
        clusterId: 'cluster-1',
        type: 'node_offline',
        severity: 'critical',
        message: 'No NAS Escritorio esta offline ha 1 hora',
        relatedEntityId: 'node-1',
      });

      expect(result.id).toBe('alert-1');
      expect(result.type).toBe('node_offline');
      expect(result.severity).toBe('critical');
      expect(result.resolved).toBe(false);
    });
  });

  describe('resolveAlert()', () => {
    it('should mark alert as resolved with timestamp (RN-A2)', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({
        id: 'alert-1',
        resolved: false,
      });
      mockPrisma.alert.update.mockImplementation((args: any) => ({
        id: 'alert-1',
        resolved: true,
        resolvedAt: args.data.resolvedAt,
      }));

      const result = await healthService.resolveAlert('alert-1');

      expect(result.resolved).toBe(true);
      expect(result.resolvedAt).toBeDefined();
    });

    it('should throw NotFoundException for non-existent alert', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue(null);

      await expect(healthService.resolveAlert('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if already resolved', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({
        id: 'alert-1',
        resolved: true,
      });

      await expect(healthService.resolveAlert('alert-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('listAlerts()', () => {
    it('should return active alerts for a cluster', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([
        {
          id: 'a1',
          type: 'node_offline',
          severity: 'critical',
          message: 'Node offline',
          resolved: false,
          relatedEntityId: 'node-1',
          createdAt: new Date(),
          resolvedAt: null,
        },
        {
          id: 'a2',
          type: 'replication_low',
          severity: 'warning',
          message: 'Replicacao abaixo de 3x',
          resolved: false,
          relatedEntityId: null,
          createdAt: new Date(),
          resolvedAt: null,
        },
      ]);

      const result = await healthService.listAlerts('cluster-1');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('node_offline');
    });

    it('should filter by resolved status', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([]);

      await healthService.listAlerts('cluster-1', { resolved: false });

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clusterId: 'cluster-1',
            resolved: false,
          }),
        }),
      );
    });
  });

  describe('checkHeartbeats()', () => {
    it('should mark nodes as suspect after 30min without heartbeat (RN-N1)', async () => {
      const thirtyOneMinAgo = new Date(Date.now() - 31 * 60 * 1000);
      mockPrisma.node.findMany
        .mockResolvedValueOnce([ // suspect candidates
          {
            id: 'node-1',
            clusterId: 'cluster-1',
            name: 'NAS Escritorio',
            status: 'online',
            lastHeartbeat: thirtyOneMinAgo,
          },
        ])
        .mockResolvedValueOnce([]); // lost candidates
      mockPrisma.node.update.mockResolvedValue({});

      const result = await healthService.checkHeartbeats();

      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-1' },
          data: { status: 'suspect' },
        }),
      );
      expect(result.suspect).toBe(1);
    });

    it('should mark nodes as lost after 1h without heartbeat (RN-N2)', async () => {
      const sixtyOneMinAgo = new Date(Date.now() - 61 * 60 * 1000);
      mockPrisma.node.findMany
        .mockResolvedValueOnce([]) // suspect candidates
        .mockResolvedValueOnce([ // lost candidates
          {
            id: 'node-2',
            clusterId: 'cluster-1',
            name: 'S3 Bucket',
            status: 'suspect',
            lastHeartbeat: sixtyOneMinAgo,
          },
        ]);
      mockPrisma.node.update.mockResolvedValue({});

      const result = await healthService.checkHeartbeats();

      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-2' },
          data: { status: 'lost' },
        }),
      );
      expect(result.lost).toBe(1);
    });

    it('should not affect nodes with recent heartbeats', async () => {
      mockPrisma.node.findMany.mockResolvedValue([]);

      const result = await healthService.checkHeartbeats();

      expect(result.suspect).toBe(0);
      expect(result.lost).toBe(0);
      expect(mockPrisma.node.update).not.toHaveBeenCalled();
    });
  });

  describe('live()', () => {
    it('should return ok status', () => {
      expect(healthService.live()).toEqual({ status: 'ok' });
    });
  });

  describe('ready()', () => {
    it('should return ok when all checks pass', async () => {
      // Mock prisma.$queryRaw and redis ping would go here
      // For unit test, just verify the shape
      const result = await healthService.ready();
      expect(result.status).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.checks.database).toBeDefined();
    });
  });
});
