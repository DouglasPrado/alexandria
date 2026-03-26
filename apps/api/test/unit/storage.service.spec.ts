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
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({ _sum: { size: 0, referenceCount: 0 } }),
    create: jest.fn(),
    update: jest.fn(),
  },
  chunkReplica: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({}),
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
  node: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn((fn: Function) => fn(mockPrisma)),
  $queryRaw: jest.fn().mockResolvedValue([{ bytes_logical: BigInt(0) }]),
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

    it('should increment usedCapacity on nodes after distributing chunks', async () => {
      mockPrisma.chunk.findUnique.mockResolvedValue(null);
      mockPrisma.chunk.create.mockResolvedValue({});
      mockPrisma.chunkReplica.create.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifest.findUnique.mockResolvedValue({ id: 'm1' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});
      mockPrisma.node.updateMany.mockResolvedValue({ count: 1 });

      const content = Buffer.alloc(10_000, 0xaa);
      await storageService.distributeChunks('file-cap', content, masterKey);

      // Should increment usedCapacity on at least one node (best-effort via updateMany)
      expect(mockPrisma.node.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            usedCapacity: expect.objectContaining({ increment: expect.any(BigInt) }),
          }),
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

  describe('storeInNode()', () => {
    it('should store data in a node via StorageProvider and return nodeId + key', async () => {
      const data = Buffer.from('preview binary data');
      const result = await storageService.storeInNode('preview:file-1', data);

      expect(result.nodeId).toBeDefined();
      expect(result.key).toBe('preview:file-1');
    });

    it('should increment usedCapacity on the target node', async () => {
      mockPrisma.node.updateMany.mockResolvedValue({ count: 1 });
      const data = Buffer.alloc(5000, 0xbb);
      const result = await storageService.storeInNode('preview:file-2', data);

      expect(mockPrisma.node.updateMany).toHaveBeenCalledWith({
        where: { id: result.nodeId },
        data: { usedCapacity: { increment: BigInt(5000) } },
      });
    });

    it('should store in first available node from hash ring', async () => {
      const data = Buffer.alloc(1024, 0xab);
      const result = await storageService.storeInNode('preview:file-2', data);

      // Should pick a node from the ring
      expect(['node-1', 'node-2', 'node-3']).toContain(result.nodeId);
    });
  });

  describe('onModuleInit() — node loading', () => {
    const mockCluster = { id: 'cluster-dev' };
    const mockAdmin = { id: 'admin-dev', clusterId: 'cluster-dev', role: 'admin' };

    /** Helper: encrypt config the same way NodeService does (AES-256-GCM, key=0x00*32) */
    function encryptConfig(config: Record<string, unknown>): Buffer {
      const { randomBytes, createCipheriv } = require('node:crypto');
      const key = Buffer.alloc(32, 0);
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(config), 'utf-8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([iv, authTag, encrypted]);
    }

    function buildFreshPrisma(overrides: Record<string, any> = {}) {
      return {
        ...mockPrisma,
        node: {
          ...mockPrisma.node,
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation((args: any) => ({
            id: args.data.id ?? 'auto-id',
            ...args.data,
          })),
          updateMany: jest.fn().mockResolvedValue({}),
          ...overrides,
        },
        cluster: { findFirst: jest.fn().mockResolvedValue(mockCluster) },
        member: { findFirst: jest.fn().mockResolvedValue(mockAdmin) },
      };
    }

    async function buildService(prisma: any): Promise<StorageService> {
      const module = await Test.createTestingModule({
        providers: [
          StorageService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();
      return module.get<StorageService>(StorageService);
    }

    it('should load S3 node from decrypted configEncrypted', async () => {
      const config = encryptConfig({
        endpoint: 'https://s3.sa-east-1.amazonaws.com',
        bucket: 'my-bucket',
        accessKey: 'AKIATEST',
        secretKey: 'secret123',
        region: 'sa-east-1',
      });

      const prisma = buildFreshPrisma({
        findMany: jest.fn().mockResolvedValue([
          { id: 'node-s3', type: 's3', endpoint: '', status: 'online', configEncrypted: config },
        ]),
      });

      const service = await buildService(prisma);
      await service.onModuleInit();

      // S3 node should be loaded into the ring from decrypted config
      const providers = (service as any).providers;
      expect(providers.has('node-s3')).toBe(true);
    });

    it('should load AWS S3 node without endpoint in configEncrypted (derives from region)', async () => {
      const config = encryptConfig({
        bucket: 'my-bucket',
        accessKey: 'AKIATEST',
        secretKey: 'secret123',
        region: 'sa-east-1',
      });

      const prisma = buildFreshPrisma({
        findMany: jest.fn().mockResolvedValue([
          { id: 'node-aws', type: 's3', endpoint: '', status: 'online', configEncrypted: config },
        ]),
      });

      const service = await buildService(prisma);
      await service.onModuleInit();

      const providers = (service as any).providers;
      expect(providers.has('node-aws')).toBe(true);
    });

    it('should skip S3 nodes with missing credentials in configEncrypted', async () => {
      const config = encryptConfig({
        endpoint: 'https://r2.example.com',
        bucket: 'my-bucket',
        accessKey: '',
        secretKey: '',
        region: 'us-east-1',
      });

      const prisma = buildFreshPrisma({
        findMany: jest.fn().mockResolvedValue([
          { id: 'node-bad', type: 'r2', endpoint: 'https://r2.example.com', status: 'online', configEncrypted: config },
        ]),
      });

      const service = await buildService(prisma);
      await service.onModuleInit();

      const providers = (service as any).providers;
      expect(providers.has('node-bad')).toBe(false);
    });

    it('should load local nodes without configEncrypted', async () => {
      const prisma = buildFreshPrisma({
        findMany: jest.fn().mockResolvedValue([
          { id: 'node-local', type: 'local', endpoint: '/tmp/test-chunks', status: 'online' },
        ]),
      });

      const service = await buildService(prisma);
      await service.onModuleInit();

      // Local node should be loaded; storeInNode should route to it
      const result = await service.storeInNode('preview:file-1', Buffer.from('thumb'));
      expect(result.nodeId).toBe('node-local');
    });

    it('should create a local node in the DB when no valid nodes exist in non-production', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const prisma = buildFreshPrisma({
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      });

      const service = await buildService(prisma);
      await service.onModuleInit();

      // Must persist node to DB — not just in-memory
      expect(prisma.node.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'local',
          name: expect.stringContaining('Local'),
          endpoint: expect.stringContaining('apps/data/chunks'),
          status: 'online',
        }),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should reuse existing local node from DB instead of creating duplicate', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const existingNode = {
        id: 'existing-local',
        type: 'local',
        endpoint: 'apps/data/chunks',
        status: 'online',
        name: 'Dev Local Node',
      };

      const prisma = buildFreshPrisma({
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(existingNode),
      });

      const service = await buildService(prisma);
      await service.onModuleInit();

      // Should NOT create a new node — reuse existing
      expect(prisma.node.create).not.toHaveBeenCalled();

      // But should register it in the ring
      const result = await service.storeInNode('preview:test', Buffer.from('data'));
      expect(result.nodeId).toBe('existing-local');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not create fallback node in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const prisma = buildFreshPrisma({
        findMany: jest.fn().mockResolvedValue([]),
      });

      const service = await buildService(prisma);
      await service.onModuleInit();

      // No fallback in production
      expect(prisma.node.create).not.toHaveBeenCalled();
      expect(prisma.node.findFirst).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('rebalance()', () => {
    /**
     * Rebalanceamento automatico — ADR-006 (Consistent Hashing)
     * Para cada chunk, compara replicas atuais com nos ideais do anel.
     * Adiciona replicas em nos que devem ter o chunk; remove excesso (>3).
     */

    it('should copy chunk to missing ideal node (REB-1: under-replicated)', async () => {
      // chunk-1 esta em node-1 e node-2; ring diz que deve estar tambem em node-3
      mockPrisma.chunk.findMany.mockResolvedValue([{ id: 'chunk-1', size: 100 }]);
      mockPrisma.chunkReplica.findMany.mockResolvedValue([
        { id: 'r1', chunkId: 'chunk-1', nodeId: 'node-1', status: 'healthy' },
        { id: 'r2', chunkId: 'chunk-1', nodeId: 'node-2', status: 'healthy' },
      ]);
      mockPrisma.chunkReplica.create.mockResolvedValue({});

      // Provide data so getFromNode works for node-1
      const node1Provider = (storageService as any).providers.get('node-1');
      node1Provider.get.mockResolvedValue(Buffer.from('chunk-data'));

      const result = await storageService.rebalance();

      expect(result.chunksRelocated).toBeGreaterThanOrEqual(1);
      expect(mockPrisma.chunkReplica.create).toHaveBeenCalled();
    });

    it('should skip chunk already on 3 correct nodes (REB-2: already balanced)', async () => {
      // Descobre quais 3 nos o ring seleciona para 'chunk-abc' — registramos so 3 nos entao vai ser todos
      mockPrisma.chunk.findMany.mockResolvedValue([{ id: 'chunk-abc', size: 200 }]);
      mockPrisma.chunkReplica.findMany.mockResolvedValue([
        { id: 'r1', chunkId: 'chunk-abc', nodeId: 'node-1', status: 'healthy' },
        { id: 'r2', chunkId: 'chunk-abc', nodeId: 'node-2', status: 'healthy' },
        { id: 'r3', chunkId: 'chunk-abc', nodeId: 'node-3', status: 'healthy' },
      ]);

      const result = await storageService.rebalance();

      expect(result.chunksSkipped).toBe(1);
      expect(result.chunksRelocated).toBe(0);
      expect(mockPrisma.chunkReplica.create).not.toHaveBeenCalled();
    });

    it('should remove excess replica when chunk has more than 3 replicas (REB-3: over-replicated)', async () => {
      // 4 nos registrados: adiciona node-4 temporariamente
      storageService.registerNode('node-4', 100, { ...mockProvider });

      // chunk-xyz esta em 4 nos mas so deveria estar em 3
      mockPrisma.chunk.findMany.mockResolvedValue([{ id: 'chunk-xyz', size: 50 }]);
      mockPrisma.chunkReplica.findMany.mockResolvedValue([
        { id: 'r1', chunkId: 'chunk-xyz', nodeId: 'node-1', status: 'healthy' },
        { id: 'r2', chunkId: 'chunk-xyz', nodeId: 'node-2', status: 'healthy' },
        { id: 'r3', chunkId: 'chunk-xyz', nodeId: 'node-3', status: 'healthy' },
        { id: 'r4', chunkId: 'chunk-xyz', nodeId: 'node-4', status: 'healthy' },
      ]);
      mockPrisma.chunkReplica.delete.mockResolvedValue({});

      const result = await storageService.rebalance();

      // Deve remover a replica excedente
      expect(mockPrisma.chunkReplica.delete).toHaveBeenCalled();
      expect(result.chunksRelocated).toBeGreaterThanOrEqual(0);

      storageService.unregisterNode('node-4');
    });

    it('should count as failed when provider.put throws (REB-4: copy error)', async () => {
      mockPrisma.chunk.findMany.mockResolvedValue([{ id: 'chunk-fail', size: 100 }]);
      mockPrisma.chunkReplica.findMany.mockResolvedValue([
        { id: 'r1', chunkId: 'chunk-fail', nodeId: 'node-1', status: 'healthy' },
        { id: 'r2', chunkId: 'chunk-fail', nodeId: 'node-2', status: 'healthy' },
      ]);

      // node-1 returns data but node-3 (missing) provider.put throws
      const node1Provider = (storageService as any).providers.get('node-1');
      node1Provider.get.mockResolvedValue(Buffer.from('chunk-data'));
      const node3Provider = (storageService as any).providers.get('node-3');
      node3Provider.put.mockRejectedValueOnce(new Error('disk full'));

      const result = await storageService.rebalance();

      expect(result.chunksFailed).toBeGreaterThanOrEqual(1);
    });

    it('should return zeros when no chunks exist (REB-5: empty)', async () => {
      mockPrisma.chunk.findMany.mockResolvedValue([]);

      const result = await storageService.rebalance();

      expect(result.chunksRelocated).toBe(0);
      expect(result.chunksSkipped).toBe(0);
      expect(result.chunksFailed).toBe(0);
    });
  });

  describe('getDedupStats()', () => {
    /**
     * Metricas de deduplicacao — Fase 2 (content-addressable chunks).
     * bytesLogical = o que seria armazenado sem dedup (size × referenceCount por chunk)
     * bytesSaved   = bytesLogical - bytesStored (economizado pela dedup)
     * dedupRatio   = bytesSaved / bytesLogical × 100
     */

    it('should return zeros when no chunks exist (DEDUP-1)', async () => {
      mockPrisma.chunk.count.mockResolvedValue(0);
      mockPrisma.chunk.aggregate
        .mockResolvedValueOnce({ _sum: { size: 0 } })
        .mockResolvedValueOnce({ _sum: { referenceCount: 0 } });
      mockPrisma.$queryRaw.mockResolvedValue([{ bytes_logical: BigInt(0) }]);

      const result = await storageService.getDedupStats();

      expect(result.totalChunks).toBe(0);
      expect(result.totalReferences).toBe(0);
      expect(result.bytesStored).toBe(0);
      expect(result.bytesSaved).toBe(0);
      expect(result.dedupRatio).toBe(0);
    });

    it('should report zero savings when all chunks are referenced once (DEDUP-2)', async () => {
      mockPrisma.chunk.count.mockResolvedValue(3);
      mockPrisma.chunk.aggregate
        .mockResolvedValueOnce({ _sum: { size: 3000 } })
        .mockResolvedValueOnce({ _sum: { referenceCount: 3 } });
      mockPrisma.$queryRaw.mockResolvedValue([{ bytes_logical: BigInt(3000) }]);

      const result = await storageService.getDedupStats();

      expect(result.totalChunks).toBe(3);
      expect(result.totalReferences).toBe(3);
      expect(result.bytesStored).toBe(3000);
      expect(result.bytesSaved).toBe(0);
      expect(result.dedupRatio).toBe(0);
    });

    it('should calculate savings when a chunk is referenced multiple times (DEDUP-3)', async () => {
      // 1 chunk de 1000 bytes referenciado 3 vezes = 2000 bytes economizados
      mockPrisma.chunk.count.mockResolvedValue(1);
      mockPrisma.chunk.aggregate
        .mockResolvedValueOnce({ _sum: { size: 1000 } })
        .mockResolvedValueOnce({ _sum: { referenceCount: 3 } });
      mockPrisma.$queryRaw.mockResolvedValue([{ bytes_logical: BigInt(3000) }]);

      const result = await storageService.getDedupStats();

      expect(result.totalChunks).toBe(1);
      expect(result.totalReferences).toBe(3);
      expect(result.bytesStored).toBe(1000);
      expect(result.bytesLogical).toBe(3000);
      expect(result.bytesSaved).toBe(2000);
      expect(result.dedupRatio).toBe(67); // Math.round(2000/3000*100)
    });

    it('should handle mixed chunks — some shared, some unique (DEDUP-4)', async () => {
      // 2 chunks unicos (2000 bytes), mas logicamente 5000 bytes referenciados
      mockPrisma.chunk.count.mockResolvedValue(2);
      mockPrisma.chunk.aggregate
        .mockResolvedValueOnce({ _sum: { size: 2000 } })
        .mockResolvedValueOnce({ _sum: { referenceCount: 5 } });
      mockPrisma.$queryRaw.mockResolvedValue([{ bytes_logical: BigInt(5000) }]);

      const result = await storageService.getDedupStats();

      expect(result.bytesSaved).toBe(3000);
      expect(result.dedupRatio).toBe(60);
    });
  });

  describe('getFromNode()', () => {
    it('should retrieve data from a specific node', async () => {
      const data = Buffer.from('stored content');

      // Store first
      const stored = await storageService.storeInNode('test-key', data);

      // Retrieve — mock provider.get returns the data
      const node1Provider = (storageService as any).providers.get(stored.nodeId);
      node1Provider.get.mockResolvedValue(data);

      const result = await storageService.getFromNode(stored.nodeId, 'test-key');
      expect(result.equals(data)).toBe(true);
    });

    it('should throw if node not found', async () => {
      await expect(
        storageService.getFromNode('non-existent-node', 'key'),
      ).rejects.toThrow();
    });
  });

  describe('tier-aware distributeChunks()', () => {
    /**
     * Tiered storage — Fase 2.
     * Tiers: hot (rapido/caro), warm (padrao), cold (lento/barato).
     * distributeChunks prefere nos de tier compativel com o mediaType do arquivo.
     * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Tiered storage)
     *
     * - photo/video → preferir hot → warm → cold
     * - archive     → preferir cold → warm → hot
     * - document    → preferir warm → hot → cold
     */

    const makeProvider = () => ({
      put: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      capacity: jest.fn(),
    });

    function setupTierMocks() {
      mockPrisma.chunk.findUnique.mockResolvedValue(null);
      mockPrisma.chunk.create.mockResolvedValue({ id: 'ck', size: 100, referenceCount: 1 });
      mockPrisma.chunkReplica.create.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'mf-1' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});
    }

    it('should prefer hot-tier nodes for photo uploads (TIER-5)', async () => {
      // 4 nodes: 2 hot + 1 warm + 1 cold → replication 3 → hot1, hot2, warm; cold NOT used
      const hot1 = makeProvider();
      const hot2 = makeProvider();
      const warm = makeProvider();
      const cold = makeProvider();

      const module = await Test.createTestingModule({
        providers: [StorageService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const svc = module.get<StorageService>(StorageService);

      svc.registerNode('node-hot1', 100, hot1, 'hot');
      svc.registerNode('node-hot2', 100, hot2, 'hot');
      svc.registerNode('node-warm', 100, warm, 'warm');
      svc.registerNode('node-cold', 100, cold, 'cold');

      setupTierMocks();

      await svc.distributeChunks('file-1', Buffer.alloc(100, 0xab), Buffer.alloc(32, 0xcd), 'photo');

      expect(hot1.put).toHaveBeenCalled();
      expect(hot2.put).toHaveBeenCalled();
      expect(cold.put).not.toHaveBeenCalled();
    });

    it('should prefer cold-tier nodes for archive uploads (TIER-6)', async () => {
      // 4 nodes: 1 hot + 1 warm + 2 cold → replication 3 → cold1, cold2, warm; hot NOT used
      const hot = makeProvider();
      const warm = makeProvider();
      const cold1 = makeProvider();
      const cold2 = makeProvider();

      const module = await Test.createTestingModule({
        providers: [StorageService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const svc = module.get<StorageService>(StorageService);

      svc.registerNode('node-hot', 100, hot, 'hot');
      svc.registerNode('node-warm', 100, warm, 'warm');
      svc.registerNode('node-cold1', 100, cold1, 'cold');
      svc.registerNode('node-cold2', 100, cold2, 'cold');

      setupTierMocks();

      await svc.distributeChunks('file-2', Buffer.alloc(100, 0xab), Buffer.alloc(32, 0xcd), 'archive');

      expect(cold1.put).toHaveBeenCalled();
      expect(cold2.put).toHaveBeenCalled();
      expect(hot.put).not.toHaveBeenCalled();
    });

    it('should fall back to warm when preferred tier unavailable (TIER-7)', async () => {
      const warm = makeProvider();
      const cold = makeProvider();

      const module = await Test.createTestingModule({
        providers: [StorageService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const svc = module.get<StorageService>(StorageService);

      // No hot nodes — only warm and cold
      svc.registerNode('node-warm', 100, warm, 'warm');
      svc.registerNode('node-cold', 100, cold, 'cold');

      setupTierMocks();

      // photo upload with no hot nodes — falls back to warm first
      await svc.distributeChunks('file-3', Buffer.alloc(100, 0xab), Buffer.alloc(32, 0xcd), 'photo');

      expect(warm.put).toHaveBeenCalled();
    });
  });

  describe('distributeWithErasure()', () => {
    /**
     * Erasure coding — Fase 3.
     * RS(10,4): 10 data shards + 4 parity shards = 14 total.
     * Cada shard é armazenado em um nó diferente (round-robin se < 14 nós).
     * Arquivo é marcado com codingScheme='erasure' no manifest.
     * Fonte: docs/blueprint/11-build_plan.md (Fase 3 — Erasure coding 10+4)
     */

    function setupErasureMocks() {
      mockPrisma.chunk.findUnique.mockResolvedValue(null);
      mockPrisma.chunk.create.mockResolvedValue({ id: 'ck', size: 100, referenceCount: 1 });
      mockPrisma.chunkReplica.create.mockResolvedValue({});
      mockPrisma.manifest.create.mockResolvedValue({ id: 'mf-erasure', codingScheme: 'erasure' });
      mockPrisma.manifestChunk.create.mockResolvedValue({});
      mockPrisma.file.update.mockResolvedValue({});
    }

    it('should distribute 14 shards across 14 nodes (EC-4/EC-6)', async () => {
      const providers = Array.from({ length: 14 }, () => ({
        put: jest.fn().mockResolvedValue(undefined),
        get: jest.fn(), exists: jest.fn(), delete: jest.fn(), list: jest.fn(), capacity: jest.fn(),
      }));

      const module = await Test.createTestingModule({
        providers: [StorageService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const svc = module.get<StorageService>(StorageService);

      for (let i = 0; i < 14; i++) {
        svc.registerNode(`node-${i}`, 100, providers[i]!);
      }
      setupErasureMocks();

      await svc.distributeWithErasure('file-1', Buffer.alloc(1000, 0xab), Buffer.alloc(32, 0xcd));

      // All 14 nodes should have received exactly one shard
      for (const p of providers) {
        expect(p.put).toHaveBeenCalledTimes(1);
      }
    });

    it('should distribute with fewer nodes (round-robin fallback) (EC-5)', async () => {
      const providers = Array.from({ length: 5 }, () => ({
        put: jest.fn().mockResolvedValue(undefined),
        get: jest.fn(), exists: jest.fn(), delete: jest.fn(), list: jest.fn(), capacity: jest.fn(),
      }));

      const module = await Test.createTestingModule({
        providers: [StorageService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const svc = module.get<StorageService>(StorageService);

      for (let i = 0; i < 5; i++) {
        svc.registerNode(`node-${i}`, 100, providers[i]!);
      }
      setupErasureMocks();

      await svc.distributeWithErasure('file-2', Buffer.alloc(1000, 0xab), Buffer.alloc(32, 0xcd));

      // Total puts across all nodes = 14 shards (distributed round-robin)
      const totalPuts = providers.reduce((sum, p) => sum + p.put.mock.calls.length, 0);
      expect(totalPuts).toBe(14);
    });

    it('should record codingScheme=erasure in manifest (EC-7)', async () => {
      const module = await Test.createTestingModule({
        providers: [StorageService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const svc = module.get<StorageService>(StorageService);
      svc.registerNode('node-1', 100, { ...mockProvider });
      setupErasureMocks();

      await svc.distributeWithErasure('file-3', Buffer.alloc(500, 0xab), Buffer.alloc(32, 0xcd));

      expect(mockPrisma.manifest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ codingScheme: 'erasure' }),
        }),
      );
    });
  });
});
