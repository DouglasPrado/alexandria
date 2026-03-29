import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * NodeRepository — abstrai acesso a dados de nos.
 * Fonte: docs/backend/04-data-layer.md (NodeRepository)
 */
@Injectable()
export class NodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Record<string, unknown>) {
    return this.prisma.node.create({ data: data as any });
  }

  async findById(id: string) {
    return this.prisma.node.findUnique({ where: { id } });
  }

  async findByIdWithChunkCount(id: string) {
    return this.prisma.node.findUnique({
      where: { id },
      include: { _count: { select: { chunkReplicas: true } } },
    });
  }

  async countByCluster(clusterId: string) {
    return this.prisma.node.count({ where: { clusterId } });
  }

  async countOnline(clusterId: string) {
    return this.prisma.node.count({ where: { clusterId, status: 'online' } });
  }

  async listByCluster(clusterId: string, opts?: { cursor?: string; take?: number; status?: string }) {
    const where: any = { clusterId };
    if (opts?.status) where.status = opts.status;
    const query: any = {
      where,
      include: { _count: { select: { chunkReplicas: true } } },
      orderBy: { createdAt: 'asc' },
      take: opts?.take,
    };
    if (opts?.cursor) {
      query.cursor = { id: opts.cursor };
      query.skip = 1;
    }
    return this.prisma.node.findMany(query);
  }

  async findSuspect(thresholdDate: Date) {
    return this.prisma.node.findMany({
      where: { status: 'online', lastHeartbeat: { lt: thresholdDate } },
    });
  }

  async findLost(thresholdDate: Date) {
    return this.prisma.node.findMany({
      where: { status: 'suspect', lastHeartbeat: { lt: thresholdDate } },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.node.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.node.delete({ where: { id } });
  }
}
