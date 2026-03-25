import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { split, hash } from '@alexandria/core-sdk';
import sharp from 'sharp';

const MAX_PHOTO_WIDTH = 1920;
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_QUALITY = 60;

/**
 * MediaProcessor — pipeline de processamento de midia.
 * Fonte: docs/blueprint/07-critical_flows.md (Upload e Distribuicao, passos 5-18)
 *
 * Pipeline: classify → optimize → preview → metadata → chunk → status ready
 * - Photos: sharp resize WebP 1920px + thumbnail ~50KB (RN-F2)
 * - Videos: stub (FFmpeg requer binario externo — MVP placeholder)
 * - Documents: bypass otimizacao (RN-F3)
 */
@Injectable()
export class MediaProcessor {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processa arquivo completo: optimize → preview → chunk → update status.
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
        // Video stub — FFmpeg not yet integrated
        // In MVP, store video as-is (no transcoding)
        optimizedContent = fileBuffer;
        metadata = { note: 'video transcoding pending — FFmpeg integration' };

        // Preview stub
        await this.createPreview(fileId, Buffer.alloc(1024, 0), 'video_preview', 'mp4');
      } else {
        // Documents bypass optimization (RN-F3)
        optimizedContent = fileBuffer;
        metadata = { pages: 1 }; // stub

        await this.createPreview(fileId, Buffer.alloc(512, 0), 'generic_icon', 'png');
      }

      // Chunk the optimized content
      const contentHash = hash(optimizedContent);
      const chunks = split(optimizedContent);

      // Store chunks and create manifest
      await this.storeChunksAndManifest(fileId, chunks, contentHash);

      // Update file status to ready
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'ready',
          optimizedSize: BigInt(optimizedContent.length),
          contentHash,
          metadata,
        },
      });
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

  /**
   * Processa foto: resize WebP max 1920px (RN-F2).
   */
  private async processPhoto(buffer: Buffer): Promise<{ optimized: Buffer; metadata: Record<string, unknown> }> {
    const sharpInstance = sharp(buffer);
    const meta = await sharpInstance.metadata();

    const optimized = await sharp(buffer)
      .resize(MAX_PHOTO_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      optimized,
      metadata: {
        width: meta.width,
        height: meta.height,
        format: meta.format,
      },
    };
  }

  /**
   * Gera thumbnail ~50KB WebP (RN-P2).
   */
  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(THUMBNAIL_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toBuffer();
  }

  /**
   * Cria registro de preview no banco.
   */
  private async createPreview(
    fileId: string,
    data: Buffer,
    type: string = 'thumbnail',
    format: string = 'webp',
  ): Promise<void> {
    await this.prisma.preview.create({
      data: {
        fileId,
        type,
        size: BigInt(data.length),
        format,
        contentHash: hash(data),
        storagePath: `previews/${fileId}`,
      },
    });
  }

  /**
   * Armazena chunks no banco e cria manifest.
   * Nota: distribuicao real para nos via StorageProvider sera integrada quando
   * o StorageService do orchestrator estiver completo.
   */
  private async storeChunksAndManifest(
    fileId: string,
    chunks: Array<{ hash: string; chunkIndex: number; size: number; data: Buffer }>,
    contentHash: string,
  ): Promise<void> {
    const chunksJson: Array<{ chunkId: string; chunkIndex: number; size: number }> = [];

    for (const chunk of chunks) {
      // Check dedup
      const existing = await this.prisma.chunk.findUnique({ where: { id: chunk.hash } });

      if (!existing) {
        await this.prisma.chunk.create({
          data: {
            id: chunk.hash,
            size: chunk.size,
            referenceCount: 1,
          },
        });
      }

      chunksJson.push({
        chunkId: chunk.hash,
        chunkIndex: chunk.chunkIndex,
        size: chunk.size,
      });
    }

    // Create manifest
    const manifest = await this.prisma.manifest.create({
      data: {
        fileId,
        chunksJson,
        fileKeyEncrypted: Buffer.alloc(48), // Placeholder — real encryption in StorageService integration
        signature: Buffer.alloc(64), // Placeholder — real signing in StorageService integration
        replicatedTo: [],
        version: 1,
      },
    });

    // Create manifest_chunk join records
    for (const entry of chunksJson) {
      await this.prisma.manifestChunk.create({
        data: {
          manifestId: manifest.id,
          chunkId: entry.chunkId,
          chunkIndex: entry.chunkIndex,
        },
      });
    }
  }
}
