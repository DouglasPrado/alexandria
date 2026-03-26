import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { decrypt, reassemble, type ChunkData } from '@alexandria/core-sdk';

/** Limites de tamanho por tipo de midia (RN-F4) */
const SIZE_LIMITS: Record<string, number> = {
  photo: 50 * 1024 * 1024, // 50MB
  video: 10 * 1024 * 1024 * 1024, // 10GB
  document: 2 * 1024 * 1024 * 1024, // 2GB
  archive: 5 * 1024 * 1024 * 1024, // 5GB
};

/** MIME types classificados como archive */
const ARCHIVE_MIME_TYPES = new Set([
  'application/zip',
  'application/gzip',
  'application/x-tar',
  'application/x-apple-diskimage',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
]);

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
    private readonly storageService: StorageService,
    @InjectQueue('media-pipeline') private readonly mediaQueue: Queue,
  ) {}

  /** Whitelist de MIME types aceitos — docs/backend/10-validation.md */
  private static readonly ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
    // photo
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
    // video
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
    // document
    'application/pdf', 'application/msword',
    // archive (also in ARCHIVE_MIME_TYPES)
    ...ARCHIVE_MIME_TYPES,
  ]);

  /** Prefixos de MIME types aceitos via wildcard — text/*, application/vnd.openxmlformats-* */
  private static readonly ALLOWED_MIME_PREFIXES: readonly string[] = [
    'text/',
    'application/vnd.openxmlformats-',
  ];

  /**
   * Valida se MIME type esta na whitelist.
   * Rejeita tipos nao permitidos com 400.
   * Fonte: docs/backend/10-validation.md
   */
  private validateMimeType(mimeType: string): void {
    if (FileService.ALLOWED_MIME_TYPES.has(mimeType)) return;
    if (FileService.ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) return;
    throw new BadRequestException(`MIME type nao permitido: ${mimeType}`);
  }

  /**
   * Classifica MIME type para media type (RN-F1).
   * image/* → photo, video/* → video, archive set → archive, demais → document
   */
  private classifyMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (ARCHIVE_MIME_TYPES.has(mimeType)) return 'archive';
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

    // Validate MIME type against whitelist (10-validation.md)
    this.validateMimeType(file.mimetype);

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
   * Lista arquivos com cursor pagination e filtros de busca.
   * Conforme backend/05-api-contracts.md — GET /api/files
   * UC-010: search por nome, filtro por tipo, range de datas (RF-063, RF-064)
   */
  async list(
    clusterId: string,
    query: {
      cursor?: string;
      limit?: number;
      mediaType?: string;
      status?: string;
      search?: string;
      from?: string;
      to?: string;
    },
  ) {
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const where: Record<string, unknown> = { clusterId };
    if (query.mediaType) where.mediaType = query.mediaType;
    if (query.status) where.status = query.status;
    // UC-010: busca por nome (case-insensitive ILIKE)
    if (query.search) where.originalName = { contains: query.search, mode: 'insensitive' };
    // UC-010: filtro por range de datas
    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};
      if (query.from) createdAt.gte = new Date(query.from);
      if (query.to) createdAt.lte = new Date(query.to);
      where.createdAt = createdAt;
    }

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

  /**
   * Remove arquivo completo: chunks do storage, preview, registros no banco, atualiza capacidade dos nós.
   * Preview e Manifest cascadeiam via onDelete: Cascade no schema.
   *
   * Fluxo: load replicas → delete chunks from nodes → update node capacity → delete DB records
   */
  async remove(fileId: string, clusterId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('Arquivo nao encontrado');
    }
    if (file.clusterId !== clusterId) {
      throw new NotFoundException('Arquivo nao encontrado');
    }

    // 1. Delete preview from storage node
    const preview = await this.prisma.preview.findUnique({ where: { fileId } });
    if (preview) {
      const colonIndex = preview.storagePath.indexOf(':');
      if (colonIndex > 0 && !preview.storagePath.startsWith('/')) {
        const nodeId = preview.storagePath.substring(0, colonIndex);
        const key = preview.storagePath.substring(colonIndex + 1);
        await this.storageService.deleteFromNode(nodeId, key);
      }
    }

    // 2. Load all chunk replicas for this file's manifest (with chunk size)
    const replicas = await this.prisma.chunkReplica.findMany({
      where: { chunk: { manifestChunks: { some: { manifest: { fileId } } } } },
      select: { chunkId: true, nodeId: true, chunk: { select: { size: true } } },
    });

    // 3. Identify unique chunks and load referenceCount
    const uniqueChunkIds = [...new Set(replicas.map((r) => r.chunkId))];
    const chunks = await this.prisma.chunk.findMany({
      where: { id: { in: uniqueChunkIds } },
      select: { id: true, referenceCount: true },
    });
    const chunkMap = new Map(chunks.map((c) => [c.id, c.referenceCount]));

    // 4. Delete chunks from storage nodes + update capacity (only for orphan chunks)
    const capacityByNode = new Map<string, bigint>();
    for (const replica of replicas) {
      const refCount = chunkMap.get(replica.chunkId) ?? 1;
      if (refCount <= 1) {
        // Orphan chunk — remove physically and free capacity
        await this.storageService.deleteFromNode(replica.nodeId, replica.chunkId);
        const current = capacityByNode.get(replica.nodeId) ?? 0n;
        capacityByNode.set(replica.nodeId, current + BigInt(replica.chunk.size));
      }
    }

    for (const [nodeId, freed] of capacityByNode) {
      await this.prisma.node.update({
        where: { id: nodeId },
        data: { usedCapacity: { decrement: freed } },
      });
    }

    // 5. Clean up chunk records: delete orphans, decrement shared
    for (const chunkId of uniqueChunkIds) {
      const refCount = chunkMap.get(chunkId) ?? 1;
      if (refCount <= 1) {
        // Delete replicas first (FK constraint), then the chunk itself
        await this.prisma.chunkReplica.deleteMany({ where: { chunkId } });
        await this.prisma.chunk.delete({ where: { id: chunkId } });
      } else {
        // Shared chunk — only decrement reference count, keep replicas
        await this.prisma.chunk.update({
          where: { id: chunkId },
          data: { referenceCount: { decrement: 1 } },
        });
      }
    }

    // 6. Delete file (cascades to preview, manifest, manifest_chunks)
    await this.prisma.file.delete({ where: { id: fileId } });
  }

  /**
   * Download: busca manifest → carrega chunks dos nós → descriptografa → reassembla.
   * Retorna buffer completo + metadata para o controller enviar como resposta binária.
   */
  async download(fileId: string): Promise<{ data: Buffer; filename: string; mimeType: string }> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('Arquivo nao encontrado');
    }

    const manifest = await this.prisma.manifest.findUnique({ where: { fileId } });
    if (!manifest) {
      throw new NotFoundException('Manifest nao encontrado — arquivo ainda em processamento');
    }

    // Decrypt file key from manifest (envelope encryption)
    const masterKey = Buffer.alloc(32, 0xab); // TODO: get real master key from cluster vault
    const fkBuf = manifest.fileKeyEncrypted as Buffer;
    const fileKey = decrypt(
      {
        iv: fkBuf.subarray(0, 12),
        authTag: fkBuf.subarray(12, 28),
        ciphertext: fkBuf.subarray(28),
      },
      masterKey,
    );

    // Load chunks in order from manifest
    const chunksJson = manifest.chunksJson as Array<{ chunkId: string; chunkIndex: number; size: number }>;
    const decryptedChunks: ChunkData[] = [];

    for (const entry of chunksJson) {
      // Find a replica node that has this chunk
      const replica = await this.prisma.chunkReplica.findFirst({
        where: { chunkId: entry.chunkId, status: 'healthy' },
        select: { nodeId: true },
      });

      if (!replica) {
        throw new NotFoundException(`Chunk ${entry.chunkId.substring(0, 16)} nao encontrado em nenhum no`);
      }

      // Fetch encrypted chunk from storage node
      const encryptedBuf = await this.storageService.getFromNode(replica.nodeId, entry.chunkId);

      // Decrypt chunk (iv:12 + authTag:16 + ciphertext)
      const chunkData = decrypt(
        {
          iv: encryptedBuf.subarray(0, 12),
          authTag: encryptedBuf.subarray(12, 28),
          ciphertext: encryptedBuf.subarray(28),
        },
        fileKey,
      );

      decryptedChunks.push({
        hash: entry.chunkId,
        chunkIndex: entry.chunkIndex,
        size: chunkData.length,
        data: chunkData,
      });
    }

    // Reassemble chunks into original file
    const data = reassemble(decryptedChunks);

    return {
      data,
      filename: file.originalName,
      mimeType: file.mimeType,
    };
  }

  /**
   * Retorna preview binario de um arquivo, buscado do no de storage.
   * storagePath format: "nodeId:key"
   */
  async getPreview(fileId: string): Promise<{ data: Buffer; format: string; size: number }> {
    const preview = await this.prisma.preview.findUnique({
      where: { fileId },
    });

    if (!preview) {
      throw new NotFoundException('Preview nao encontrado — arquivo ainda em processamento');
    }

    // storagePath format: "nodeId:preview:fileId.format" (new) or "/path/to/file" (legacy)
    const colonIndex = preview.storagePath.indexOf(':');

    if (colonIndex > 0 && !preview.storagePath.startsWith('/')) {
      // New format: fetch from storage node
      const nodeId = preview.storagePath.substring(0, colonIndex);
      const key = preview.storagePath.substring(colonIndex + 1);
      const data = await this.storageService.getFromNode(nodeId, key);
      return { data, format: preview.format, size: Number(preview.size) };
    }

    // Legacy format: read from local filesystem (for previews created before node storage)
    const { readFile } = await import('node:fs/promises');
    const { resolve, isAbsolute } = await import('node:path');
    const { existsSync } = await import('node:fs');

    // Resolve relative paths from data/ directory
    let fsPath = preview.storagePath;
    if (!isAbsolute(fsPath)) {
      fsPath = resolve(process.cwd(), 'data', fsPath);
    }
    // Try adding extension if missing
    if (!existsSync(fsPath) && !fsPath.includes('.')) {
      fsPath = `${fsPath}.${preview.format}`;
    }

    if (!existsSync(fsPath)) {
      throw new NotFoundException('Preview file not found — file may need re-processing');
    }

    const data = await readFile(fsPath);
    return { data, format: preview.format, size: Number(preview.size) };
  }
}
