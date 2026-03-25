import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from '@alexandria/core-sdk';
import { StorageService } from '../modules/storage/storage.service';
import sharp from 'sharp';

const MAX_PHOTO_WIDTH = 1920;
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_QUALITY = 60;

/**
 * MediaProcessor — pipeline de processamento de midia.
 * Fonte: docs/blueprint/07-critical_flows.md (Upload e Distribuicao, passos 5-18)
 *
 * Pipeline: classify → optimize → preview → metadata → distribute (StorageService) → status ready
 * - Photos: sharp resize WebP 1920px + thumbnail ~50KB (RN-F2)
 * - Videos: stub (FFmpeg requer binario externo — MVP placeholder)
 * - Documents: bypass otimizacao (RN-F3)
 */
@Injectable()
export class MediaProcessor {
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
    if (!file) return;

    try {
      let optimizedContent: Buffer;
      let metadata: Record<string, unknown> = {};

      if (file.mediaType === 'photo') {
        const result = await this.processPhoto(fileBuffer);
        optimizedContent = result.optimized;
        metadata = result.metadata;

        // Generate thumbnail preview
        const thumbnail = await this.generateThumbnail(fileBuffer);
        await this.createPreview(fileId, thumbnail);
      } else if (file.mediaType === 'video') {
        optimizedContent = fileBuffer;
        metadata = { note: 'video transcoding pending — FFmpeg integration' };
        await this.createPreview(fileId, Buffer.alloc(1024, 0), 'video_preview', 'mp4');
      } else {
        optimizedContent = fileBuffer;
        metadata = { pages: 1 };
        await this.createPreview(fileId, Buffer.alloc(512, 0), 'generic_icon', 'png');
      }

      // Update metadata before distribution
      await this.prisma.file.update({
        where: { id: fileId },
        data: { metadata: metadata as Record<string, string> },
      });

      // Distribute chunks via StorageService (encrypt + send to S3 nodes)
      // Uses a placeholder master key — in production, derived from cluster seed
      const masterKey = Buffer.alloc(32, 0xab); // TODO: get real master key from cluster vault
      await this.storageService.distributeChunks(fileId, optimizedContent, masterKey);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
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
    // Store preview in storage node (S3/local) via StorageService
    const key = `preview:${fileId}.${format}`;
    const stored = await this.storageService.storeInNode(key, data);

    await this.prisma.preview.create({
      data: {
        fileId,
        type,
        size: BigInt(data.length),
        format,
        contentHash: hash(data),
        storagePath: `${stored.nodeId}:${stored.key}`, // nodeId:key format for retrieval
      },
    });
  }
}
