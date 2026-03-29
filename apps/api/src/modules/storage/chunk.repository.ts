import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ChunkRepository + ChunkReplicaRepository + ManifestRepository.
 * Fonte: docs/backend/04-data-layer.md (storage repositories)
 */
@Injectable()
export class ChunkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.chunk.findUnique({ where: { id } });
  }

  async findOrphans() {
    return this.prisma.chunk.findMany({ where: { referenceCount: 0 } });
  }

  async incrementReference(id: string) {
    return this.prisma.chunk.update({
      where: { id },
      data: { referenceCount: { increment: 1 } },
    });
  }

  async decrementReference(id: string) {
    return this.prisma.chunk.update({
      where: { id },
      data: { referenceCount: { decrement: 1 } },
    });
  }
}

@Injectable()
export class ChunkReplicaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countByChunk(chunkId: string, opts?: { status?: string; excludeNode?: string }) {
    const where: any = { chunkId };
    if (opts?.status) where.status = opts.status;
    if (opts?.excludeNode) where.nodeId = { not: opts.excludeNode };
    return this.prisma.chunkReplica.count({ where });
  }

  async findByNode(nodeId: string) {
    return this.prisma.chunkReplica.findMany({ where: { nodeId } });
  }

  async findHealthyByChunk(chunkId: string, excludeId?: string) {
    const where: any = { chunkId, status: 'healthy' };
    if (excludeId) where.id = { not: excludeId };
    return this.prisma.chunkReplica.findMany({ where });
  }

  async findSubReplicated(minReplicas = 3) {
    return this.prisma.chunkReplica.groupBy({
      by: ['chunkId'],
      having: { chunkId: { _count: { lt: minReplicas } } },
    });
  }

  async deleteByNode(nodeId: string) {
    return this.prisma.chunkReplica.deleteMany({ where: { nodeId } });
  }
}

@Injectable()
export class ManifestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByFileId(fileId: string) {
    return this.prisma.manifest.findUnique({ where: { fileId } });
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.manifest.create({ data: data as any });
  }
}
