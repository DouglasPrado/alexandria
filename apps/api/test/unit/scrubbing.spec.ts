import { Test } from '@nestjs/testing';
import { HealthService } from '../../src/modules/health/health.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationService } from '../../src/modules/notification/notification.service';

/**
 * Testes de Scrubbing — verificacao periodica de integridade via SHA-256.
 * Fonte: docs/blueprint/07-critical_flows.md (Scrubbing e Verificacao de Integridade)
 * Fonte: docs/backend/06-services.md (HealthService.scrub)
 *
 * Regras:
 * - RN-CR3: Scrubbing periodico recalcula SHA-256 e compara com chunk_id
 * - RN-CR4: Replica corrompida substituida automaticamente
 *
 * Fluxo:
 * 1. Seleciona batch de replicas ordenado por verified_at ASC NULLS FIRST
 * 2. Para cada: le chunk do no, recalcula SHA-256, compara com chunk_id
 * 3. Se match: atualiza verified_at
 * 4. Se mismatch: marca corrompida, repara com replica saudavel, gera alerta
 */

const mockPrisma = {
  chunkReplica: {
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  alert: {
    create: jest.fn().mockImplementation((args: any) => ({
      id: 'alert-scrub',
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
  file: {
    update: jest.fn(),
  },
  manifest: {
    findMany: jest.fn(),
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
  registerNode: jest.fn(),
  unregisterNode: jest.fn(),
};

const mockNotifications = {
  sendInviteEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendNodeLostAlert: jest.fn().mockResolvedValue(undefined),
  sendFileErrorEmail: jest.fn().mockResolvedValue(undefined),
};

describe('Scrubbing', () => {
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

  describe('scrub(batchSize)', () => {
    it('should verify healthy chunks and update verified_at (RN-CR3)', async () => {
      // Arrange: 2 replicas, both pass SHA-256 verification
      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: 'abcd1234', nodeId: 'node-1', status: 'healthy', verifiedAt: null },
        { id: 'r2', chunkId: 'efgh5678', nodeId: 'node-2', status: 'healthy', verifiedAt: null },
      ]);

      // getFromNode returns data whose SHA-256 matches the chunkId
      const { createHash } = await import('node:crypto');
      const data1 = Buffer.from('chunk-data-1');
      const hash1 = createHash('sha256').update(data1).digest('hex');
      const data2 = Buffer.from('chunk-data-2');
      const hash2 = createHash('sha256').update(data2).digest('hex');

      // Override chunkIds to match the hashes
      mockPrisma.chunkReplica.findMany.mockReset();
      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: hash1, nodeId: 'node-1', status: 'healthy', verifiedAt: null },
        { id: 'r2', chunkId: hash2, nodeId: 'node-2', status: 'healthy', verifiedAt: null },
      ]);

      mockStorageService.getFromNode
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2);

      mockPrisma.chunkReplica.update.mockResolvedValue({});

      // Act
      const result = await healthService.scrub(1000);

      // Assert
      expect(result.verified).toBe(2);
      expect(result.corrupted).toBe(0);
      expect(result.repaired).toBe(0);
      expect(mockPrisma.chunkReplica.update).toHaveBeenCalledTimes(2);
      // verified_at should be updated
      expect(mockPrisma.chunkReplica.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r1' },
          data: expect.objectContaining({ verifiedAt: expect.any(Date) }),
        }),
      );
    });

    it('should detect corrupted replica and repair from healthy copy (RN-CR4)', async () => {
      const { createHash } = await import('node:crypto');
      const goodData = Buffer.from('correct-chunk-data');
      const correctHash = createHash('sha256').update(goodData).digest('hex');
      const corruptData = Buffer.from('CORRUPTED-data');

      mockPrisma.chunkReplica.findMany
        // batch query
        .mockResolvedValueOnce([
          { id: 'r1', chunkId: correctHash, nodeId: 'node-1', status: 'healthy', verifiedAt: null },
        ])
        // healthy replicas for repair
        .mockResolvedValueOnce([
          { id: 'r2', chunkId: correctHash, nodeId: 'node-2', status: 'healthy' },
        ]);

      // First read returns corrupt data
      mockStorageService.getFromNode
        .mockResolvedValueOnce(corruptData)  // corrupted read from node-1
        .mockResolvedValueOnce(goodData);    // healthy read from node-2 for repair

      mockPrisma.chunkReplica.update.mockResolvedValue({});

      const result = await healthService.scrub(1000);

      expect(result.corrupted).toBe(1);
      expect(result.repaired).toBe(1);
      // Should mark replica as corrupted
      expect(mockPrisma.chunkReplica.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r1' },
          data: expect.objectContaining({ status: 'corrupted' }),
        }),
      );
    });

    it('should skip replicas on offline nodes gracefully', async () => {
      const { createHash } = await import('node:crypto');
      const data = Buffer.from('some-data');
      const hash = createHash('sha256').update(data).digest('hex');

      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([
        { id: 'r1', chunkId: hash, nodeId: 'node-offline', status: 'healthy', verifiedAt: null },
      ]);

      // Node is offline — getFromNode throws
      mockStorageService.getFromNode.mockRejectedValueOnce(new Error('Node not found in ring'));

      const result = await healthService.scrub(1000);

      expect(result.verified).toBe(0);
      expect(result.corrupted).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should mark chunk irrecoverable when all replicas are corrupted', async () => {
      const { createHash } = await import('node:crypto');
      const correctHash = createHash('sha256').update(Buffer.from('original')).digest('hex');
      const corruptData = Buffer.from('BAD-DATA');

      mockPrisma.chunkReplica.findMany
        // batch query
        .mockResolvedValueOnce([
          { id: 'r1', chunkId: correctHash, nodeId: 'node-1', status: 'healthy', verifiedAt: null },
        ])
        // no healthy replicas left for repair
        .mockResolvedValueOnce([]);

      mockStorageService.getFromNode.mockResolvedValueOnce(corruptData);
      mockPrisma.chunkReplica.update.mockResolvedValue({});

      const result = await healthService.scrub(1000);

      expect(result.corrupted).toBe(1);
      expect(result.repaired).toBe(0);
      expect(result.irrecoverable).toBe(1);
      // Should create critical alert for irrecoverable chunk
      expect(mockPrisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            severity: 'critical',
            type: 'corruption_detected',
          }),
        }),
      );
    });

    it('should mark parent File as corrupted when chunk is irrecoverable', async () => {
      const { createHash } = await import('node:crypto');
      const correctHash = createHash('sha256').update(Buffer.from('original')).digest('hex');
      const corruptData = Buffer.from('BAD-DATA');

      mockPrisma.chunkReplica.findMany
        .mockResolvedValueOnce([
          { id: 'r1', chunkId: correctHash, nodeId: 'node-1', status: 'healthy', verifiedAt: null },
        ])
        .mockResolvedValueOnce([]); // no healthy replicas

      mockStorageService.getFromNode.mockResolvedValueOnce(corruptData);
      mockPrisma.chunkReplica.update.mockResolvedValue({});

      // manifestChunk → manifest → file chain
      mockPrisma.manifestChunk.findFirst.mockResolvedValue({
        manifest: {
          file: { id: 'file-1', clusterId: 'cluster-1', status: 'ready' },
        },
      });
      mockPrisma.file.update.mockResolvedValue({});

      await healthService.scrub(1000);

      // Should update file status to corrupted
      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'file-1' },
          data: expect.objectContaining({ status: 'corrupted' }),
        }),
      );
    });

    it('should respect batchSize limit', async () => {
      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([]);

      await healthService.scrub(500);

      expect(mockPrisma.chunkReplica.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 500,
        }),
      );
    });

    it('should return ScrubResult with all counters', async () => {
      mockPrisma.chunkReplica.findMany.mockResolvedValueOnce([]);

      const result = await healthService.scrub(1000);

      expect(result).toEqual(
        expect.objectContaining({
          verified: expect.any(Number),
          corrupted: expect.any(Number),
          repaired: expect.any(Number),
          skipped: expect.any(Number),
          irrecoverable: expect.any(Number),
        }),
      );
    });
  });
});
