import { Test } from '@nestjs/testing';
import { NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { FileService } from '../../src/modules/file/file.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { encrypt, generateKey } from '@alexandria/core-sdk';

/**
 * Testes do FileService — upload, listagem, detalhes.
 * Fonte: docs/backend/06-services.md (FileService)
 * Fonte: docs/blueprint/04-domain-model.md (RN-F1..F6)
 * Fonte: docs/backend/05-api-contracts.md (POST /api/files/upload, GET /api/files)
 *
 * - RN-F1: Classificacao automatica via MIME type
 * - RN-F4: Limites de tamanho por tipo
 */

const mockPrisma = {
  file: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  node: {
    count: jest.fn(),
    update: jest.fn(),
  },
  manifest: {
    findUnique: jest.fn(),
  },
  manifestChunk: {
    count: jest.fn(),
  },
  chunk: {
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  chunkReplica: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  preview: {
    findUnique: jest.fn(),
  },
};

const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-1' }),
};

const mockStorageService = {
  getFromNode: jest.fn().mockResolvedValue(Buffer.from('preview-binary')),
  storeInNode: jest.fn(),
  distributeChunks: jest.fn(),
  deleteFromNode: jest.fn().mockResolvedValue(undefined),
};

const QUEUE_TOKEN = 'BullQueue_media-pipeline';

describe('FileService', () => {
  let fileService: FileService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: QUEUE_TOKEN, useValue: mockQueue },
      ],
    }).compile();

    fileService = module.get<FileService>(FileService);
  });

  describe('upload()', () => {
    it('should create file with status processing and return 202 data', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.file.create.mockImplementation((args: any) => ({
        id: 'file-1',
        originalName: args.data.originalName,
        mimeType: args.data.mimeType,
        mediaType: args.data.mediaType,
        originalSize: args.data.originalSize,
        status: 'processing',
        createdAt: new Date(),
      }));

      const result = await fileService.upload('cluster-1', 'member-1', {
        originalname: 'foto_natal.jpg',
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024, // 5MB
        buffer: Buffer.alloc(100),
      });

      expect(result.name).toBe('foto_natal.jpg');
      expect(result.status).toBe('processing');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should classify image/* as photo (RN-F1)', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      let capturedMediaType = '';
      mockPrisma.file.create.mockImplementation((args: any) => {
        capturedMediaType = args.data.mediaType;
        return { id: 'f1', originalName: 'test.png', mimeType: 'image/png', mediaType: capturedMediaType, originalSize: BigInt(1000), status: 'processing', createdAt: new Date() };
      });

      await fileService.upload('c1', 'm1', { originalname: 'test.png', mimetype: 'image/png', size: 1000, buffer: Buffer.alloc(10) });
      expect(capturedMediaType).toBe('photo');
    });

    it('should classify video/* as video (RN-F1)', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      let capturedMediaType = '';
      mockPrisma.file.create.mockImplementation((args: any) => {
        capturedMediaType = args.data.mediaType;
        return { id: 'f1', originalName: 'clip.mp4', mimeType: 'video/mp4', mediaType: capturedMediaType, originalSize: BigInt(1000), status: 'processing', createdAt: new Date() };
      });

      await fileService.upload('c1', 'm1', { originalname: 'clip.mp4', mimetype: 'video/mp4', size: 1000, buffer: Buffer.alloc(10) });
      expect(capturedMediaType).toBe('video');
    });

    it('should classify other types as document (RN-F1)', async () => {
      mockPrisma.node.count.mockResolvedValue(3);
      let capturedMediaType = '';
      mockPrisma.file.create.mockImplementation((args: any) => {
        capturedMediaType = args.data.mediaType;
        return { id: 'f1', originalName: 'doc.pdf', mimeType: 'application/pdf', mediaType: capturedMediaType, originalSize: BigInt(1000), status: 'processing', createdAt: new Date() };
      });

      await fileService.upload('c1', 'm1', { originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1000, buffer: Buffer.alloc(10) });
      expect(capturedMediaType).toBe('document');
    });

    it('should throw PayloadTooLargeException for photo > 50MB (RN-F4)', async () => {
      mockPrisma.node.count.mockResolvedValue(3);

      await expect(
        fileService.upload('c1', 'm1', {
          originalname: 'huge.jpg',
          mimetype: 'image/jpeg',
          size: 51 * 1024 * 1024,
          buffer: Buffer.alloc(10),
        }),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('should throw PayloadTooLargeException for video > 10GB (RN-F4)', async () => {
      mockPrisma.node.count.mockResolvedValue(3);

      await expect(
        fileService.upload('c1', 'm1', {
          originalname: 'huge.mp4',
          mimetype: 'video/mp4',
          size: 11 * 1024 * 1024 * 1024,
          buffer: Buffer.alloc(10),
        }),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('should throw ServiceUnavailableException if < MIN_NODES active (RN-N6)', async () => {
      // Default MIN_NODES_FOR_REPLICATION=1, so 0 active nodes = should throw
      mockPrisma.node.count.mockResolvedValue(0);

      await expect(
        fileService.upload('c1', 'm1', {
          originalname: 'foto.jpg',
          mimetype: 'image/jpeg',
          size: 1000,
          buffer: Buffer.alloc(10),
        }),
      ).rejects.toThrow();
    });
  });

  describe('findById()', () => {
    it('should return file details with uploader info', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        clusterId: 'c1',
        originalName: 'natal.jpg',
        mimeType: 'image/jpeg',
        mediaType: 'photo',
        originalSize: BigInt(5000000),
        optimizedSize: BigInt(500000),
        contentHash: 'abc123',
        metadata: { width: 1920, height: 1080 },
        status: 'ready',
        createdAt: new Date(),
        uploader: { id: 'member-1', name: 'Douglas Prado' },
        manifest: { id: 'manifest-1' },
        _count: { manifest: { manifestChunks: 2 } },
      });
      mockPrisma.manifestChunk.count.mockResolvedValue(2);

      const result = await fileService.findById('file-1');

      expect(result.name).toBe('natal.jpg');
      expect(result.mediaType).toBe('photo');
      expect(result.status).toBe('ready');
      expect(result.uploadedBy.name).toBe('Douglas Prado');
    });

    it('should throw NotFoundException for non-existent file', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);

      await expect(fileService.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list()', () => {
    it('should return paginated file list', async () => {
      mockPrisma.file.findMany.mockResolvedValue([
        {
          id: 'f1',
          originalName: 'foto1.jpg',
          mimeType: 'image/jpeg',
          mediaType: 'photo',
          originalSize: BigInt(5000000),
          optimizedSize: BigInt(500000),
          status: 'ready',
          metadata: null,
          createdAt: new Date(),
        },
        {
          id: 'f2',
          originalName: 'foto2.jpg',
          mimeType: 'image/jpeg',
          mediaType: 'photo',
          originalSize: BigInt(3000000),
          optimizedSize: BigInt(300000),
          status: 'ready',
          metadata: null,
          createdAt: new Date(),
        },
      ]);

      const result = await fileService.list('cluster-1', {});

      expect(result.data).toHaveLength(2);
      expect(result.meta.hasMore).toBe(false);
    });

    it('should filter by mediaType', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);

      await fileService.list('cluster-1', { mediaType: 'video' });

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mediaType: 'video',
          }),
        }),
      );
    });

    it('should support cursor pagination', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);

      await fileService.list('cluster-1', { cursor: 'file-abc', limit: 10 });

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11, // limit + 1 to detect hasMore
          cursor: { id: 'file-abc' },
          skip: 1,
        }),
      );
    });
  });

  describe('remove()', () => {
    const mockFile = {
      id: 'file-1',
      clusterId: 'cluster-1',
      status: 'ready',
    };

    const mockPreview = {
      fileId: 'file-1',
      storagePath: 'node-1:preview:file-1.webp',
      format: 'webp',
      size: BigInt(5000),
    };

    const mockReplicas = [
      { chunkId: 'chunk-a', nodeId: 'node-1', chunk: { size: 4000000 } },
      { chunkId: 'chunk-a', nodeId: 'node-2', chunk: { size: 4000000 } },
      { chunkId: 'chunk-b', nodeId: 'node-1', chunk: { size: 3000000 } },
    ];

    it('should delete chunks from storage nodes', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(mockFile);
      mockPrisma.preview.findUnique.mockResolvedValue(mockPreview);
      mockPrisma.chunkReplica.findMany.mockResolvedValue(mockReplicas);
      mockPrisma.chunk.update.mockResolvedValue({});
      mockPrisma.chunk.delete.mockResolvedValue({});
      mockPrisma.chunkReplica.deleteMany.mockResolvedValue({});
      mockPrisma.node.update.mockResolvedValue({});
      mockPrisma.file.delete.mockResolvedValue({});

      await fileService.remove('file-1', 'cluster-1');

      // Should delete each replica's chunk from storage
      expect(mockStorageService.deleteFromNode).toHaveBeenCalledWith('node-1', 'chunk-a');
      expect(mockStorageService.deleteFromNode).toHaveBeenCalledWith('node-2', 'chunk-a');
      expect(mockStorageService.deleteFromNode).toHaveBeenCalledWith('node-1', 'chunk-b');
    });

    it('should delete preview from storage node', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(mockFile);
      mockPrisma.preview.findUnique.mockResolvedValue(mockPreview);
      mockPrisma.chunkReplica.findMany.mockResolvedValue([]);
      mockPrisma.file.delete.mockResolvedValue({});

      await fileService.remove('file-1', 'cluster-1');

      expect(mockStorageService.deleteFromNode).toHaveBeenCalledWith('node-1', 'preview:file-1.webp');
    });

    it('should update usedCapacity on affected nodes', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(mockFile);
      mockPrisma.preview.findUnique.mockResolvedValue(null);
      mockPrisma.chunkReplica.findMany.mockResolvedValue(mockReplicas);
      mockPrisma.chunk.update.mockResolvedValue({});
      mockPrisma.chunk.delete.mockResolvedValue({});
      mockPrisma.chunkReplica.deleteMany.mockResolvedValue({});
      mockPrisma.node.update.mockResolvedValue({});
      mockPrisma.file.delete.mockResolvedValue({});

      await fileService.remove('file-1', 'cluster-1');

      // node-1 has replicas r1 (4MB) + r3 (3MB) = 7MB freed
      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-1' },
          data: { usedCapacity: { decrement: BigInt(7000000) } },
        }),
      );
      // node-2 has replica r2 (4MB) freed
      expect(mockPrisma.node.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-2' },
          data: { usedCapacity: { decrement: BigInt(4000000) } },
        }),
      );
    });

    it('should throw NotFoundException for non-existent file', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);
      await expect(fileService.remove('no-file', 'cluster-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if file belongs to another cluster', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({ ...mockFile, clusterId: 'other-cluster' });
      await expect(fileService.remove('file-1', 'cluster-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('download()', () => {
    // Build real encrypted data for test
    const masterKey = Buffer.alloc(32, 0xab);
    const fileKey = generateKey();
    const originalContent = Buffer.from('family photo binary content here');

    // Encrypt file key with master key (same as distributeChunks)
    const fkEnc = encrypt(fileKey, masterKey);
    const fileKeyEncrypted = Buffer.concat([fkEnc.iv, fkEnc.authTag, fkEnc.ciphertext]);

    // Encrypt chunk with file key
    const chunkEnc = encrypt(originalContent, fileKey);
    const encryptedChunk = Buffer.concat([chunkEnc.iv, chunkEnc.authTag, chunkEnc.ciphertext]);

    it('should reassemble and decrypt file from chunks', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        clusterId: 'cluster-1',
        originalName: 'foto.webp',
        mimeType: 'image/webp',
        status: 'ready',
      });

      mockPrisma.manifest.findUnique.mockResolvedValue({
        id: 'manifest-1',
        fileId: 'file-1',
        fileKeyEncrypted,
        chunksJson: [
          { chunkId: 'chunk-a', chunkIndex: 0, size: originalContent.length },
        ],
      });

      mockPrisma.chunkReplica.findFirst = jest.fn().mockResolvedValue({ nodeId: 'node-1' });
      mockStorageService.getFromNode.mockResolvedValue(encryptedChunk);

      const result = await fileService.download('file-1');

      expect(result.filename).toBe('foto.webp');
      expect(result.mimeType).toBe('image/webp');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.equals(originalContent)).toBe(true);
    });

    it('should throw NotFoundException for non-existent file', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);
      await expect(fileService.download('no-file')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if file has no manifest', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        clusterId: 'c1',
        status: 'processing',
      });
      mockPrisma.manifest.findUnique.mockResolvedValue(null);

      await expect(fileService.download('file-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreview()', () => {
    it('should fetch preview binary from storage node', async () => {
      mockPrisma.preview.findUnique.mockResolvedValue({
        fileId: 'file-1',
        storagePath: 'node-1:preview:file-1.webp',
        format: 'webp',
        size: BigInt(50000),
      });
      mockStorageService.getFromNode.mockResolvedValue(Buffer.from('preview-data'));

      const result = await fileService.getPreview('file-1');

      expect(result.data).toEqual(Buffer.from('preview-data'));
      expect(result.format).toBe('webp');
      expect(mockStorageService.getFromNode).toHaveBeenCalledWith('node-1', 'preview:file-1.webp');
    });

    it('should throw NotFoundException if preview not found', async () => {
      mockPrisma.preview.findUnique.mockResolvedValue(null);

      await expect(fileService.getPreview('no-preview')).rejects.toThrow();
    });
  });

  describe('download() — UC-005: reassembly', () => {
    /**
     * Testes de Download/Reassembly.
     * Fonte: docs/backend/05-api-contracts.md (GET /api/files/:id/download)
     * Fonte: docs/blueprint/07-critical_flows.md (Upload e Distribuicao)
     *
     * Fluxo: manifest → file key decrypt → chunks fetch → chunk decrypt → reassemble
     */

    it('should reassemble file from encrypted chunks (UC-005 happy path)', async () => {
      // Prepare: encrypt a small file the same way distributeChunks does
      const masterKey = Buffer.alloc(32, 0xab); // matches placeholder in service
      const fileKey = generateKey();
      const originalData = Buffer.from('familia prado natal 2025');

      // Encrypt file key with master key (envelope encryption)
      const fkEnc = encrypt(fileKey, masterKey);
      const fileKeyEncrypted = Buffer.concat([fkEnc.iv, fkEnc.authTag, fkEnc.ciphertext]);

      // Encrypt chunk data with file key
      const chunkEnc = encrypt(originalData, fileKey);
      const encryptedChunk = Buffer.concat([chunkEnc.iv, chunkEnc.authTag, chunkEnc.ciphertext]);

      const chunkHash = require('crypto').createHash('sha256').update(originalData).digest('hex');

      mockPrisma.file.findUnique.mockResolvedValueOnce({
        id: 'file-1',
        originalName: 'natal.webp',
        mimeType: 'image/webp',
      });

      mockPrisma.manifest.findUnique.mockResolvedValueOnce({
        fileId: 'file-1',
        fileKeyEncrypted: Buffer.from(fileKeyEncrypted),
        chunksJson: [{ chunkId: chunkHash, chunkIndex: 0, size: originalData.length }],
      });

      (mockPrisma as any).chunkReplica = {
        ...mockPrisma.chunkReplica,
        findFirst: jest.fn().mockResolvedValueOnce({ nodeId: 'node-1' }),
      };

      mockStorageService.getFromNode.mockResolvedValueOnce(encryptedChunk);

      const result = await fileService.download('file-1');

      expect(result.data.equals(originalData)).toBe(true);
      expect(result.filename).toBe('natal.webp');
      expect(result.mimeType).toBe('image/webp');
    });

    it('should throw NotFoundException for non-existent file', async () => {
      mockPrisma.file.findUnique.mockResolvedValueOnce(null);

      await expect(fileService.download('ghost')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if manifest not found (still processing)', async () => {
      mockPrisma.file.findUnique.mockResolvedValueOnce({ id: 'file-1' });
      mockPrisma.manifest.findUnique.mockResolvedValueOnce(null);

      await expect(fileService.download('file-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no healthy replica available', async () => {
      const masterKey = Buffer.alloc(32, 0xab);
      const fileKey = generateKey();
      const fkEnc = encrypt(fileKey, masterKey);
      const fileKeyEncrypted = Buffer.concat([fkEnc.iv, fkEnc.authTag, fkEnc.ciphertext]);

      mockPrisma.file.findUnique.mockResolvedValueOnce({
        id: 'file-1',
        originalName: 'foto.webp',
        mimeType: 'image/webp',
      });

      mockPrisma.manifest.findUnique.mockResolvedValueOnce({
        fileId: 'file-1',
        fileKeyEncrypted: Buffer.from(fileKeyEncrypted),
        chunksJson: [{ chunkId: 'chunk-aaa', chunkIndex: 0, size: 100 }],
      });

      (mockPrisma as any).chunkReplica = {
        ...mockPrisma.chunkReplica,
        findFirst: jest.fn().mockResolvedValueOnce(null), // no healthy replica
      };

      await expect(fileService.download('file-1')).rejects.toThrow(NotFoundException);
    });

    it('should reassemble multi-chunk file in correct order', async () => {
      const masterKey = Buffer.alloc(32, 0xab);
      const fileKey = generateKey();
      const fkEnc = encrypt(fileKey, masterKey);
      const fileKeyEncrypted = Buffer.concat([fkEnc.iv, fkEnc.authTag, fkEnc.ciphertext]);

      const chunk0Data = Buffer.from('CHUNK-ZERO-');
      const chunk1Data = Buffer.from('CHUNK-ONE');
      const hash0 = require('crypto').createHash('sha256').update(chunk0Data).digest('hex');
      const hash1 = require('crypto').createHash('sha256').update(chunk1Data).digest('hex');

      const enc0 = encrypt(chunk0Data, fileKey);
      const encBuf0 = Buffer.concat([enc0.iv, enc0.authTag, enc0.ciphertext]);
      const enc1 = encrypt(chunk1Data, fileKey);
      const encBuf1 = Buffer.concat([enc1.iv, enc1.authTag, enc1.ciphertext]);

      mockPrisma.file.findUnique.mockResolvedValueOnce({
        id: 'file-multi',
        originalName: 'video.mp4',
        mimeType: 'video/mp4',
      });

      mockPrisma.manifest.findUnique.mockResolvedValueOnce({
        fileId: 'file-multi',
        fileKeyEncrypted: Buffer.from(fileKeyEncrypted),
        chunksJson: [
          { chunkId: hash0, chunkIndex: 0, size: chunk0Data.length },
          { chunkId: hash1, chunkIndex: 1, size: chunk1Data.length },
        ],
      });

      (mockPrisma as any).chunkReplica = {
        ...mockPrisma.chunkReplica,
        findFirst: jest.fn()
          .mockResolvedValueOnce({ nodeId: 'node-1' })
          .mockResolvedValueOnce({ nodeId: 'node-2' }),
      };

      mockStorageService.getFromNode
        .mockResolvedValueOnce(encBuf0)
        .mockResolvedValueOnce(encBuf1);

      const result = await fileService.download('file-multi');

      const expected = Buffer.concat([chunk0Data, chunk1Data]);
      expect(result.data.equals(expected)).toBe(true);
    });
  });
});
