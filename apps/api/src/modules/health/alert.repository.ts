import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AlertRepository — abstrai acesso a dados de alertas.
 * Fonte: docs/backend/04-data-layer.md (AlertRepository)
 */
@Injectable()
export class AlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clusterId: string;
    type: string;
    severity: string;
    message: string;
    relatedEntityId?: string | null;
    resolved?: boolean;
  }) {
    return this.prisma.alert.create({ data: { ...data, resolved: data.resolved ?? false } });
  }

  async findById(id: string) {
    return this.prisma.alert.findUnique({ where: { id } });
  }

  async findActiveByEntity(relatedEntityId: string, type: string) {
    return this.prisma.alert.findFirst({
      where: { relatedEntityId, type, resolved: false },
    });
  }

  async listByCluster(clusterId: string, opts?: {
    cursor?: string;
    take?: number;
    resolved?: boolean;
  }) {
    const where: any = { clusterId };
    if (opts?.resolved !== undefined) where.resolved = opts.resolved;
    const query: any = {
      where,
      orderBy: { createdAt: 'desc' },
      take: opts?.take,
    };
    if (opts?.cursor) {
      query.cursor = { id: opts.cursor };
      query.skip = 1;
    }
    return this.prisma.alert.findMany(query);
  }

  async resolve(id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date() },
    });
  }

  async deleteOldResolved(olderThan: Date) {
    return this.prisma.alert.deleteMany({
      where: { resolved: true, resolvedAt: { lt: olderThan } },
    });
  }
}
