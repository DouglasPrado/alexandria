import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * FileRepository — abstrai acesso a dados de arquivos.
 * Fonte: docs/backend/04-data-layer.md (FileRepository)
 */
@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Record<string, unknown>) {
    return this.prisma.file.create({ data: data as any });
  }

  async findById(id: string) {
    return this.prisma.file.findUnique({ where: { id } });
  }

  async findByContentHash(clusterId: string, contentHash: string) {
    return this.prisma.file.findFirst({ where: { clusterId, contentHash } });
  }

  async listByCluster(clusterId: string, opts?: {
    cursor?: string;
    take?: number;
    mediaType?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = { clusterId };
    if (opts?.mediaType) where.mediaType = opts.mediaType;
    if (opts?.status) where.status = opts.status;
    if (opts?.search) where.originalName = { contains: opts.search, mode: 'insensitive' };
    if (opts?.from || opts?.to) {
      where.createdAt = {};
      if (opts?.from) where.createdAt.gte = new Date(opts.from);
      if (opts?.to) where.createdAt.lte = new Date(opts.to);
    }
    const query: any = {
      where,
      orderBy: { createdAt: 'desc' },
      take: opts?.take,
    };
    if (opts?.cursor) {
      query.cursor = { id: opts.cursor };
      query.skip = 1;
    }
    return this.prisma.file.findMany(query);
  }

  async countByCluster(clusterId: string) {
    return this.prisma.file.count({ where: { clusterId } });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.file.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.file.delete({ where: { id } });
  }
}
