import {
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

/** Limites de tamanho por tipo de midia (RN-F4) */
const SIZE_LIMITS: Record<string, number> = {
  photo: 50 * 1024 * 1024, // 50MB
  video: 10 * 1024 * 1024 * 1024, // 10GB
  document: 2 * 1024 * 1024 * 1024, // 2GB
};

const MIN_NODES_FOR_UPLOAD = parseInt(process.env.MIN_NODES_FOR_REPLICATION || '1', 10);
const DEFAULT_PAGE_SIZE = 20;

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * FileService — upload, listagem, detalhes de arquivos.
 * Fonte: docs/backend/06-services.md (FileService)
 */
@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('media-pipeline') private readonly mediaQueue: Queue,
  ) {}

  /**
   * Classifica MIME type para media type (RN-F1).
   * image/* → photo, video/* → video, demais → document
   */
  private classifyMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  /**
   * Upload de arquivo — registra com status processing, retorna 202.
   * Pipeline assincrono processa depois (BullMQ).
   *
   * RN-F1: Classificacao automatica via MIME type
   * RN-F4: Limites de tamanho por tipo
   * RN-N6: Minimo 3 nos ativos
   */
  async upload(clusterId: string, memberId: string, file: UploadedFile) {
    // RN-N6: Check min active nodes
    const activeNodes = await this.prisma.node.count({
      where: { clusterId, status: 'online' },
    });
    if (activeNodes < MIN_NODES_FOR_UPLOAD) {
      throw new ServiceUnavailableException(
        `Nos insuficientes para replicacao minima. Minimo ${MIN_NODES_FOR_UPLOAD} no(s) ativo(s) necessario(s).`,
      );
    }

    // RN-F1: Classify media type
    const mediaType = this.classifyMediaType(file.mimetype);

    // RN-F4: Check size limits
    const limit = SIZE_LIMITS[mediaType] ?? SIZE_LIMITS['document']!;
    if (file.size > limit) {
      throw new PayloadTooLargeException(
        `Arquivo excede o limite de ${Math.round(limit / (1024 * 1024))}MB para ${mediaType}`,
      );
    }

    // Create file record with status processing
    const record = await this.prisma.file.create({
      data: {
        clusterId,
        uploadedBy: memberId,
        originalName: file.originalname,
        mediaType,
        mimeType: file.mimetype,
        originalSize: BigInt(file.size),
        status: 'processing',
      },
    });

    // Enqueue BullMQ job for media pipeline (optimize → chunk → encrypt → distribute)
    await this.mediaQueue.add(
      'process-file',
      { fileId: record.id, buffer: file.buffer.toString('base64') },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      id: record.id,
      name: record.originalName,
      mimeType: record.mimeType,
      originalSize: Number(record.originalSize),
      status: record.status,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Detalhes do arquivo com uploader e chunks.
   * Conforme backend/05-api-contracts.md — GET /api/files/:id
   */
  async findById(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true } },
        manifest: { select: { id: true } },
      },
    });

    if (!file) {
      throw new NotFoundException('Arquivo nao encontrado');
    }

    let chunksCount = 0;
    if (file.manifest) {
      chunksCount = await this.prisma.manifestChunk.count({
        where: { manifestId: file.manifest.id },
      });
    }

    return {
      id: file.id,
      name: file.originalName,
      mimeType: file.mimeType,
      mediaType: file.mediaType,
      originalSize: Number(file.originalSize),
      optimizedSize: file.optimizedSize ? Number(file.optimizedSize) : null,
      status: file.status,
      hash: file.contentHash ?? '',
      previewUrl: `/api/files/${file.id}/preview`,
      metadata: file.metadata,
      chunksCount,
      replicationFactor: 3,
      uploadedBy: file.uploader,
      createdAt: file.createdAt.toISOString(),
    };
  }

  /**
   * Lista arquivos com cursor pagination.
   * Conforme backend/05-api-contracts.md — GET /api/files
   */
  async list(
    clusterId: string,
    query: { cursor?: string; limit?: number; mediaType?: string; status?: string },
  ) {
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const where: Record<string, unknown> = { clusterId };
    if (query.mediaType) where.mediaType = query.mediaType;
    if (query.status) where.status = query.status;

    const findArgs: Record<string, unknown> = {
      where,
      take: limit + 1, // +1 to detect hasMore
      orderBy: { createdAt: 'desc' },
    };

    if (query.cursor) {
      findArgs.cursor = { id: query.cursor };
      findArgs.skip = 1; // skip the cursor itself
    }

    const files = await this.prisma.file.findMany(findArgs as any);

    const hasMore = files.length > limit;
    const data = (hasMore ? files.slice(0, limit) : files).map((f: any) => ({
      id: f.id,
      name: f.originalName,
      mimeType: f.mimeType,
      mediaType: f.mediaType,
      originalSize: Number(f.originalSize),
      optimizedSize: f.optimizedSize ? Number(f.optimizedSize) : null,
      status: f.status,
      previewUrl: `/api/files/${f.id}/preview`,
      metadata: f.metadata,
      createdAt: f.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        cursor: data.length > 0 ? data[data.length - 1]!.id : null,
        hasMore,
      },
    };
  }
}
