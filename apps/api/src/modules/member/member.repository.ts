import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * MemberRepository — abstrai acesso a dados de membros.
 * Fonte: docs/backend/04-data-layer.md (MemberRepository)
 */
@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clusterId: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    invitedBy?: string | null;
  }) {
    return this.prisma.member.create({ data });
  }

  async findById(id: string) {
    return this.prisma.member.findUnique({ where: { id } });
  }

  async findByClusterAndEmail(clusterId: string, email: string) {
    return this.prisma.member.findFirst({ where: { clusterId, email } });
  }

  async countByCluster(clusterId: string) {
    return this.prisma.member.count({ where: { clusterId } });
  }

  async countAdmins(clusterId: string) {
    return this.prisma.member.count({ where: { clusterId, role: 'admin' } });
  }

  async listByCluster(clusterId: string, opts?: { cursor?: string; take?: number }) {
    const query: any = {
      where: { clusterId },
      orderBy: { joinedAt: 'asc' },
      take: opts?.take,
    };
    if (opts?.cursor) {
      query.cursor = { id: opts.cursor };
      query.skip = 1;
    }
    return this.prisma.member.findMany(query);
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.member.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.member.delete({ where: { id } });
  }
}
