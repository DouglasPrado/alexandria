import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createVault, unlockVault, unlockVaultWithMasterKey, type VaultContents, type VaultBundle } from '@alexandria/core-sdk';

/**
 * VaultService — operacoes dedicadas de vault.
 * Fonte: docs/backend/06-services.md (VaultService)
 *
 * - create: cria vault criptografado para membro
 * - unlock: desbloqueia com senha do membro
 * - unlockWithMasterKey: desbloqueia com master key (recovery)
 * - update: atualiza conteudo do vault
 * - replicate: marca vault como replicado em no
 */
@Injectable()
export class VaultService {
  constructor(private readonly prisma: PrismaService) {}

  async create(memberId: string, contents: VaultContents, password: string, masterKey: Buffer, isAdmin = false) {
    const bundle = createVault(contents, password, masterKey);
    return this.prisma.vault.create({
      data: {
        memberId,
        vaultData: new Uint8Array(bundle.encryptedData) as Uint8Array<ArrayBuffer>,
        encryptionAlgorithm: 'AES-256-GCM',
        replicatedTo: [],
        isAdminVault: isAdmin,
      },
    });
  }

  async unlock(memberId: string, password: string) {
    const vault = await this.prisma.vault.findUnique({ where: { memberId } });
    if (!vault) throw new NotFoundException('Vault nao encontrado');
    return unlockVault(JSON.parse(Buffer.from(vault.vaultData).toString()) as VaultBundle, password);
  }

  async unlockWithMasterKey(memberId: string, masterKey: Buffer) {
    const vault = await this.prisma.vault.findUnique({ where: { memberId } });
    if (!vault) throw new NotFoundException('Vault nao encontrado');
    return unlockVaultWithMasterKey(JSON.parse(Buffer.from(vault.vaultData).toString()) as VaultBundle, masterKey);
  }

  async replicate(memberId: string, nodeId: string) {
    const vault = await this.prisma.vault.findUnique({ where: { memberId } });
    if (!vault) throw new NotFoundException('Vault nao encontrado');
    const replicatedTo = [...(vault.replicatedTo as string[]), nodeId];
    return this.prisma.vault.update({
      where: { memberId },
      data: { replicatedTo },
    });
  }
}
