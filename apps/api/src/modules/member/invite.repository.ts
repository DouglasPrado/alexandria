import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * InviteRepository — abstrai acesso a dados de convites.
 * Fonte: docs/backend/04-data-layer.md (InviteRepository)
 */
@Injectable()
export class InviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clusterId: string;
    email: string;
    role: string;
    token: string;
    expiresAt: Date;
    createdBy: string;
  }) {
    return this.prisma.invite.create({ data });
  }

  async findByToken(token: string) {
    return this.prisma.invite.findFirst({ where: { token } });
  }

  async findByClusterAndEmail(clusterId: string, email: string) {
    return this.prisma.invite.findFirst({ where: { clusterId, email, acceptedAt: null } });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.invite.update({ where: { id }, data });
  }

  async deleteExpired() {
    return this.prisma.invite.deleteMany({
      where: { expiresAt: { lt: new Date() }, acceptedAt: null },
    });
  }
}
