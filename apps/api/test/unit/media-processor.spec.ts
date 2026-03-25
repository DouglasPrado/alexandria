import { Test } from '@nestjs/testing';
import { MediaProcessor } from '../../src/workers/media-processor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';

/**
 * Testes do MediaProcessor — pipeline de processamento de midia.
 * Fonte: docs/blueprint/07-critical_flows.md (Upload e Distribuicao, passos 5-18)
 * Fonte: docs/backend/06-services.md (FileService, StorageService.distributeChunks)
 *
 * Pipeline: classify → optimize → preview → extract metadata → chunk → encrypt → status ready
 * - RN-F2: Fotos → WebP 1920px; Videos → 1080p H.265
 * - RN-F3: Documentos bypass pipeline de otimizacao
 */

const mockPrisma = {
  file: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  preview: {
    create: jest.fn(),
  },
  chunk: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  manifest: {
    create: jest.fn(),
  },
  manifestChunk: {
    create: jest.fn(),
  },
  chunkReplica: {
    create: jest.fn(),
  },
  $transaction: jest.fn((fn: Function) => fn(mockPrisma)),
};

const mockStorageService = {
  distributeChunks: jest.fn().mockResolvedValue({ chunksCount: 1, replicasCount: 3 }),
  registerNode: jest.fn(),
  unregisterNode: jest.fn(),
};

// Mock sharp for photo processing
jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(500_000, 0xab)), // ~500KB optimized
    metadata: jest.fn().mockResolvedValue({ width: 4000, height: 3000, format: 'jpeg' }),
  });
  return mockSharp;
});

describe('MediaProcessor', () => {
  let processor: MediaProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        MediaProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    processor = module.get<MediaProcessor>(MediaProcessor);
  });

  describe('processFile()', () => {
    const setupFileMock = (overrides: Record<string, unknown> = {}) => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        clusterId: 'cluster-1',
        mediaType: 'photo',
        mimeType: 'image/jpeg',
        originalName: 'natal.jpg',
        originalSize: BigInt(5_000_000),
        status: 'processing',
        ...overrides,
      });
      mockPrisma.file.update.mockResolvedValue({});
      mockPrisma.preview.create.mockResolvedValue({ id: 'preview-1' });
    };

    it('should optimize photo and call StorageService.distributeChunks', async () => {
      setupFileMock();
      await processor.processFile('file-1', Buffer.alloc(5_000_000, 0xaa));

      expect(mockStorageService.distributeChunks).toHaveBeenCalledWith(
        'file-1',
        expect.any(Buffer), // optimized content
        expect.any(Buffer), // master key
      );
    });

    it('should generate preview/thumbnail for photos', async () => {
      setupFileMock();
      await processor.processFile('file-1', Buffer.alloc(5_000_000));

      expect(mockPrisma.preview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileId: 'file-1',
            type: 'thumbnail',
            format: 'webp',
          }),
        }),
      );
    });

    it('should extract and save metadata from photos', async () => {
      setupFileMock();
      await processor.processFile('file-1', Buffer.alloc(5_000_000));

      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              width: expect.any(Number),
              height: expect.any(Number),
            }),
          }),
        }),
      );
    });

    it('should bypass optimization for documents (RN-F3)', async () => {
      setupFileMock({ id: 'file-2', mediaType: 'document', mimeType: 'application/pdf', originalName: 'contract.pdf', originalSize: BigInt(100_000) });
      const docBuffer = Buffer.alloc(100_000);

      await processor.processFile('file-2', docBuffer);

      // StorageService receives the original buffer (no optimization)
      expect(mockStorageService.distributeChunks).toHaveBeenCalledWith(
        'file-2',
        docBuffer, // same buffer, no resize
        expect.any(Buffer),
      );
    });

    it('should call distributeChunks for all file types', async () => {
      setupFileMock({ id: 'file-3', mediaType: 'document', mimeType: 'application/pdf', originalName: 'doc.pdf', originalSize: BigInt(100_000) });

      await processor.processFile('file-3', Buffer.alloc(100_000));

      expect(mockStorageService.distributeChunks).toHaveBeenCalledWith(
        'file-3',
        expect.any(Buffer),
        expect.any(Buffer),
      );
    });

    it('should set status to error on failure', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-4',
        clusterId: 'cluster-1',
        mediaType: 'photo',
        mimeType: 'image/jpeg',
        originalName: 'broken.jpg',
        originalSize: BigInt(5_000_000),
        status: 'processing',
      });

      // Make sharp throw
      const sharp = require('sharp');
      sharp.mockReturnValueOnce({
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('corrupt image')),
        metadata: jest.fn().mockRejectedValue(new Error('corrupt image')),
      });

      mockPrisma.file.update.mockResolvedValue({});

      await processor.processFile('file-4', Buffer.alloc(100));

      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'file-4' },
          data: expect.objectContaining({
            status: 'error',
            errorMessage: expect.stringContaining('corrupt image'),
          }),
        }),
      );
    });

    it('should handle video and call distributeChunks with original buffer', async () => {
      const videoBuffer = Buffer.alloc(500_000);
      setupFileMock({ id: 'file-5', mediaType: 'video', mimeType: 'video/mp4', originalName: 'clip.mp4', originalSize: BigInt(500_000) });

      await processor.processFile('file-5', videoBuffer);

      expect(mockStorageService.distributeChunks).toHaveBeenCalledWith(
        'file-5',
        videoBuffer, // video stub: original buffer, no transcoding
        expect.any(Buffer),
      );
    });
  });
});
