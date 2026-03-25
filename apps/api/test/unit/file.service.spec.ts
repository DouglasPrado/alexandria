import { Test } from '@nestjs/testing';
import { NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { FileService } from '../../src/modules/file/file.service';
import { PrismaService } from '../../src/prisma/prisma.service';

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
  },
  node: {
    count: jest.fn(),
  },
  manifest: {
    findUnique: jest.fn(),
  },
  manifestChunk: {
    count: jest.fn(),
  },
};

describe('FileService', () => {
  let fileService: FileService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: PrismaService, useValue: mockPrisma },
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

    it('should throw ServiceUnavailableException if < 3 nodes active (RN-N6)', async () => {
      mockPrisma.node.count.mockResolvedValue(2);

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
});
