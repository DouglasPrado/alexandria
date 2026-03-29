import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ClusterRepository — abstrai acesso a dados de clusters.
 * Fonte: docs/backend/04-data-layer.md (ClusterRepository)
 */
@Injectable()
export class ClusterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    clusterId: string;
    name: string;
    publicKey: Uint8Array;
    encryptedPrivateKey: Uint8Array;
    status: string;
  }) {
    return this.prisma.cluster.create({
      data: {
        ...data,
        publicKey: Buffer.from(data.publicKey),
        encryptedPrivateKey: Buffer.from(data.encryptedPrivateKey),
      },
    });
  }

  async findById(id: string) {
    return this.prisma.cluster.findUnique({ where: { id } });
  }

  async findByClusterId(clusterId: string) {
    return this.prisma.cluster.findFirst({ where: { clusterId } });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.cluster.update({ where: { id }, data: { status } });
  }
}
