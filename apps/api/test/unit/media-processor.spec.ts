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
  storeInNode: jest.fn().mockResolvedValue({ nodeId: 'node-1', key: 'preview:file-1.webp' }),
  getFromNode: jest.fn(),
  registerNode: jest.fn(),
  unregisterNode: jest.fn(),
};

// Mock the ffmpeg helper module used by MediaProcessor
jest.mock('../../src/workers/ffmpeg', () => ({
  ffmpegTranscode: jest.fn().mockResolvedValue(Buffer.alloc(200_000, 0xbb)),
  ffmpegPreview: jest.fn().mockResolvedValue(Buffer.alloc(50_000, 0xcc)),
  ffprobe: jest.fn().mockResolvedValue({
    duration: 42.5,
    width: 1920,
    height: 1080,
    codec: 'h264',
    format: 'mov,mp4',
  }),
}));

// Mock pdf-renderer for PDF page rendering
jest.mock('../../src/workers/pdf-renderer', () => ({
  renderPdfPage: jest.fn().mockResolvedValue(Buffer.alloc(5_000, 0xee)), // ~5KB PNG
  getPdfPageCount: jest.fn().mockResolvedValue(5),
}));

// Mock sharp for photo and PDF processing
jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(500_000, 0xab)), // ~500KB optimized
    metadata: jest.fn().mockResolvedValue({ width: 4000, height: 3000, format: 'jpeg', pages: 5 }),
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

    it('should transcode video to H.265 1080p and generate preview (RN-F2)', async () => {
      setupFileMock({ id: 'file-5', mediaType: 'video', mimeType: 'video/mp4', originalName: 'clip.mp4', originalSize: BigInt(500_000) });

      await processor.processFile('file-5', Buffer.alloc(500_000));

      // Should call distributeChunks (transcoded content)
      expect(mockStorageService.distributeChunks).toHaveBeenCalledWith(
        'file-5',
        expect.any(Buffer),
        expect.any(Buffer),
      );

      // Should create video preview
      expect(mockPrisma.preview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileId: 'file-5',
            type: 'video_preview',
            format: 'mp4',
          }),
        }),
      );
    });

    it('should extract video metadata (duration, resolution, codec)', async () => {
      setupFileMock({ id: 'file-6', mediaType: 'video', mimeType: 'video/mp4', originalName: 'family.mp4', originalSize: BigInt(1_000_000) });

      await processor.processFile('file-6', Buffer.alloc(1_000_000));

      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              duration: expect.any(Number),
            }),
          }),
        }),
      );
    });

    it('should generate PDF preview thumbnail from first page (RN-P5)', async () => {
      setupFileMock({ id: 'file-pdf-1', mediaType: 'document', mimeType: 'application/pdf', originalName: 'contract.pdf', originalSize: BigInt(200_000) });

      await processor.processFile('file-pdf-1', Buffer.alloc(200_000, 0xdd));

      // Should create a pdf_page preview in PNG format
      expect(mockPrisma.preview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileId: 'file-pdf-1',
            type: 'pdf_page',
            format: 'png',
          }),
        }),
      );
    });

    it('should extract pages metadata from PDF', async () => {
      setupFileMock({ id: 'file-pdf-2', mediaType: 'document', mimeType: 'application/pdf', originalName: 'report.pdf', originalSize: BigInt(300_000) });

      await processor.processFile('file-pdf-2', Buffer.alloc(300_000, 0xdd));

      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              pages: expect.any(Number),
            }),
          }),
        }),
      );
    });

    it('should bypass optimization for PDF — distribute original buffer', async () => {
      setupFileMock({ id: 'file-pdf-3', mediaType: 'document', mimeType: 'application/pdf', originalName: 'invoice.pdf', originalSize: BigInt(100_000) });
      const pdfBuffer = Buffer.alloc(100_000, 0xdd);

      await processor.processFile('file-pdf-3', pdfBuffer);

      // Content distributed is the original (no optimization), but preview IS generated
      expect(mockStorageService.distributeChunks).toHaveBeenCalledWith(
        'file-pdf-3',
        pdfBuffer,
        expect.any(Buffer),
      );
      expect(mockPrisma.preview.create).toHaveBeenCalled();
    });

    it('should NOT generate preview for non-PDF documents (RN-F3)', async () => {
      setupFileMock({ id: 'file-doc-1', mediaType: 'document', mimeType: 'application/msword', originalName: 'letter.doc', originalSize: BigInt(50_000) });

      await processor.processFile('file-doc-1', Buffer.alloc(50_000));

      expect(mockPrisma.preview.create).not.toHaveBeenCalled();
    });

    it('should set status to error when PDF preview generation fails', async () => {
      setupFileMock({ id: 'file-pdf-err', mediaType: 'document', mimeType: 'application/pdf', originalName: 'corrupt.pdf', originalSize: BigInt(100) });

      // Make pdf-renderer throw on corrupt PDF
      const { getPdfPageCount } = require('../../src/workers/pdf-renderer');
      getPdfPageCount.mockRejectedValueOnce(new Error('Invalid PDF'));

      await processor.processFile('file-pdf-err', Buffer.from('not-a-pdf'));

      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'file-pdf-err' },
          data: expect.objectContaining({
            status: 'error',
            errorMessage: expect.stringContaining('Invalid PDF'),
          }),
        }),
      );
    });

    it('should set status to error when FFmpeg fails on video', async () => {
      setupFileMock({ id: 'file-7', mediaType: 'video', mimeType: 'video/mp4', originalName: 'corrupt.mp4', originalSize: BigInt(100) });

      // Make ffprobe succeed but ffmpegTranscode fail
      const ffmpegMod = require('../../src/workers/ffmpeg');
      ffmpegMod.ffmpegTranscode.mockRejectedValueOnce(new Error('FFmpeg: Invalid data found'));

      await processor.processFile('file-7', Buffer.from('not-a-video'));

      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'file-7' },
          data: expect.objectContaining({
            status: 'error',
            errorMessage: expect.stringContaining('FFmpeg'),
          }),
        }),
      );
    });
  });
});
