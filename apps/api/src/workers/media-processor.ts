import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from '@alexandria/core-sdk';
import { StorageService } from '../modules/storage/storage.service';
import { ffmpegTranscode, ffmpegPreview, ffprobe } from './ffmpeg';
import sharp from 'sharp';
import { renderPdfPage, getPdfPageCount } from './pdf-renderer';

const MAX_PHOTO_WIDTH = 1920;
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_QUALITY = 60;
const VIDEO_MAX_HEIGHT = 1080;
const VIDEO_PREVIEW_HEIGHT = 480;
const PDF_PREVIEW_WIDTH = 300;

/**
 * MediaProcessor — pipeline de processamento de midia.
 * Fonte: docs/blueprint/07-critical_flows.md (Upload e Distribuicao, passos 5-18)
 *
 * Pipeline: classify → optimize → preview → metadata → distribute (StorageService) → status ready
 * - Photos: sharp resize WebP 1920px + thumbnail ~50KB (RN-F2)
 * - Videos: FFmpeg H.265 1080p + preview 480p (RN-F2)
 * - Documents: bypass otimizacao (RN-F3)
 */
@Injectable()
export class MediaProcessor {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Processa arquivo completo: optimize → preview → distribute → update status.
   * Chamado pelo BullMQ worker apos upload.
   */
  async processFile(fileId: string, fileBuffer: Buffer): Promise<void> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      this.logger.warn(`File ${fileId} not found — skipping`);
      return;
    }

    this.logger.log(`[${fileId}] Starting pipeline — ${file.mediaType} "${file.originalName}" (${(fileBuffer.length / 1024).toFixed(0)}KB)`);
    const startTime = Date.now();

    try {
      let optimizedContent: Buffer;
      let metadata: Record<string, unknown> = {};

      if (file.mediaType === 'photo') {
        this.logger.log(`[${fileId}] Optimizing photo → WebP ${MAX_PHOTO_WIDTH}px`);
        const result = await this.processPhoto(fileBuffer);
        optimizedContent = result.optimized;
        metadata = result.metadata;
        this.logger.log(`[${fileId}] Optimized: ${(fileBuffer.length / 1024).toFixed(0)}KB → ${(optimizedContent.length / 1024).toFixed(0)}KB (${((1 - optimizedContent.length / fileBuffer.length) * 100).toFixed(0)}% reduction)`);

        this.logger.log(`[${fileId}] Generating thumbnail ${THUMBNAIL_WIDTH}px`);
        const thumbnail = await this.generateThumbnail(fileBuffer);
        await this.createPreview(fileId, thumbnail);
        this.logger.log(`[${fileId}] Preview stored (${(thumbnail.length / 1024).toFixed(1)}KB)`);
      } else if (file.mediaType === 'video') {
        this.logger.log(`[${fileId}] Transcoding video → H.265 ${VIDEO_MAX_HEIGHT}p`);
        metadata = await ffprobe(fileBuffer);
        optimizedContent = await ffmpegTranscode(fileBuffer, VIDEO_MAX_HEIGHT);
        this.logger.log(`[${fileId}] Transcoded: ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB → ${(optimizedContent.length / 1024 / 1024).toFixed(1)}MB`);

        this.logger.log(`[${fileId}] Generating video preview ${VIDEO_PREVIEW_HEIGHT}p`);
        const preview = await ffmpegPreview(fileBuffer, VIDEO_PREVIEW_HEIGHT);
        await this.createPreview(fileId, preview, 'video_preview', 'mp4');
        this.logger.log(`[${fileId}] Video preview stored (${(preview.length / 1024).toFixed(1)}KB)`);
      } else if (file.mediaType === 'document' && file.mimeType === 'application/pdf') {
        // PDF — bypass optimization but render first page as preview (RN-P5)
        this.logger.log(`[${fileId}] PDF — rendering first page preview`);
        optimizedContent = fileBuffer;

        const pageCount = await getPdfPageCount(fileBuffer);
        metadata = { pages: pageCount };

        const thumbnail = await renderPdfPage(fileBuffer, PDF_PREVIEW_WIDTH);
        await this.createPreview(fileId, thumbnail, 'pdf_page', 'png');
        this.logger.log(`[${fileId}] PDF preview stored (${(thumbnail.length / 1024).toFixed(1)}KB, ${pageCount} pages)`);
      } else {
        // document (non-PDF) and archive — bypass optimization and preview (RN-F3)
        this.logger.log(`[${fileId}] ${file.mediaType === 'archive' ? 'Archive' : 'Document'} — bypass optimization and preview (RN-F3)`);
        optimizedContent = fileBuffer;
        metadata = {};
      }

      await this.prisma.file.update({
        where: { id: fileId },
        data: { metadata: metadata as Record<string, string> },
      });

      this.logger.log(`[${fileId}] Distributing chunks → encrypt (AES-256-GCM) + replicate to nodes`);
      const masterKey = Buffer.alloc(32, 0xab); // TODO: get real master key from cluster vault
      const result = await this.storageService.distributeChunks(fileId, optimizedContent, masterKey);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`[${fileId}] Pipeline complete in ${elapsed}s — ${result.chunksCount} chunks, ${result.replicasCount} replicas → status: ready`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.error(`[${fileId}] Pipeline FAILED in ${elapsed}s — ${message}`);
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'error',
          errorMessage: message,
        },
      });
    }
  }

  private async processPhoto(
    buffer: Buffer,
  ): Promise<{ optimized: Buffer; metadata: Record<string, unknown> }> {
    const meta = await sharp(buffer).metadata();
    const optimized = await sharp(buffer)
      .resize(MAX_PHOTO_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      optimized,
      metadata: { width: meta.width, height: meta.height, format: meta.format },
    };
  }

  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(THUMBNAIL_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toBuffer();
  }

  private async createPreview(
    fileId: string,
    data: Buffer,
    type: string = 'thumbnail',
    format: string = 'webp',
  ): Promise<void> {
    const key = `preview:${fileId}.${format}`;
    const stored = await this.storageService.storeInNode(key, data);

    await this.prisma.preview.create({
      data: {
        fileId,
        type,
        size: BigInt(data.length),
        format,
        contentHash: hash(data),
        storagePath: `${stored.nodeId}:${stored.key}`,
      },
    });
  }
}
