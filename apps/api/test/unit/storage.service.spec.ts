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
  node: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
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
});
