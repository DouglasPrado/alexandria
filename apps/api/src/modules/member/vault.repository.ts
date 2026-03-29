import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * VaultRepository — abstrai acesso a dados de vaults.
 * Fonte: docs/backend/04-data-layer.md (VaultRepository)
 */
@Injectable()
export class VaultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    memberId: string;
    vaultData: Uint8Array;
    encryptionAlgorithm: string;
    replicatedTo: unknown[];
    isAdminVault: boolean;
  }) {
    return this.prisma.vault.create({ data: data as any });
  }

  async findByMemberId(memberId: string) {
    return this.prisma.vault.findUnique({ where: { memberId } });
  }

  async update(memberId: string, data: Record<string, unknown>) {
    return this.prisma.vault.update({ where: { memberId }, data });
  }
}
