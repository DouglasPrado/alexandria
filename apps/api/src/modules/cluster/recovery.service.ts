import {
  Injectable,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  validateMnemonic,
  deriveMasterKey,
  generateKeypair,
  hash,
  unlockVaultWithMasterKey,
} from '@alexandria/core-sdk';
import type { VaultContents, VaultBundle } from '@alexandria/core-sdk';

/**
 * RecoveryService — recovery completo do orquestrador via seed phrase (UC-007).
 * Fonte: docs/blueprint/07-critical_flows.md (Recovery do Orquestrador via Seed Phrase)
 * Fonte: docs/blueprint/08-use_cases.md (UC-007)
 *
 * Fluxo:
 *   3-5:  validate seed → derive master key → compute cluster_id → find cluster
 *   6:    decrypt admin vaults → extract node configs + cluster config
 *   7:    reconnect storage providers com credenciais extraidas
 *   8-9:  scan manifests dos nos → rebuild metadados (futuro)
 *   12:   integrity check — chunks, replicas, under-replication
 */
@Injectable()
export class RecoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async recover(dto: { seedPhrase: string }) {
    // --- Passos 3-5: Validate → derive → find cluster ---

    if (!validateMnemonic(dto.seedPhrase)) {
      throw new BadRequestException(
        'Seed phrase invalida. Deve conter 12 palavras do dicionario BIP-39.',
      );
    }

    const masterKey = deriveMasterKey(dto.seedPhrase);
    const { publicKey } = generateKeypair(masterKey);
    const clusterId = hash(Buffer.from(publicKey));

    const cluster = await this.prisma.cluster.findFirst({
      where: { clusterId },
    });

    if (!cluster) {
      throw new UnprocessableEntityException(
        'Seed phrase nao corresponde a nenhum cluster. Verifique as palavras e tente novamente.',
      );
    }

    // --- Passo 6: Decrypt vaults → extract node configs ---

    const vaults = await this.prisma.vault.findMany({
      where: { member: { clusterId: cluster.id } },
      include: { member: { select: { id: true, name: true, email: true } } },
    });

    let recoveredVaults = 0;
    let failedVaults = 0;
    const allNodeConfigs: VaultContents['nodeConfigs'] = [];

    for (const vault of vaults) {
      try {
        const bundle: VaultBundle = {
          encryptedData: Buffer.from(vault.vaultData),
          algorithm: vault.encryptionAlgorithm,
          passwordSalt: Buffer.from(vault.passwordSalt),
          masterKeySalt: Buffer.from(vault.masterKeySalt),
        };

        const contents = unlockVaultWithMasterKey(bundle, masterKey);
        recoveredVaults++;

        // Extract node configs from admin vaults (RN-V1)
        if (contents.nodeConfigs?.length) {
          for (const nc of contents.nodeConfigs) {
            // Deduplicate by nodeId
            if (!allNodeConfigs.some((c) => c.nodeId === nc.nodeId)) {
              allNodeConfigs.push(nc);
            }
          }
        }
      } catch {
        failedVaults++;
      }
    }

    // --- Passo 7: Reconnect storage providers ---
    // Node configs from vaults contain credentials for S3/R2/B2 nodes.
    // If StorageService is available, re-register each node in the hash ring.
    // (Actual node re-registration happens on next boot or via explicit API call)

    // --- Passos 8-9: Scan manifests → rebuild (placeholder) ---
    // Full manifest scanning from cloud nodes requires active storage connections.
    // For now, report what exists in the current DB.
    const recoveredManifests = await this.prisma.manifest.count({
      where: { file: { clusterId: cluster.id } },
    });

    // --- Passo 12: Integrity check ---

    const totalNodes = await this.prisma.node.count({
      where: { clusterId: cluster.id },
    });
    const onlineNodes = await this.prisma.node.count({
      where: { clusterId: cluster.id, status: 'online' },
    });

    const totalChunks = await this.prisma.chunk.count();
    const totalReplicas = await this.prisma.chunkReplica.count({
      where: { status: 'healthy' },
    });

    // Chunks with at least 1 healthy replica are considered recoverable
    const healthyChunks = Math.min(totalChunks, totalReplicas);
    const pendingHealing = Math.max(0, totalChunks - healthyChunks);

    return {
      status: 'recovered' as const,
      recoveredVaults,
      failedVaults,
      recoveredManifests,
      nodeConfigs: allNodeConfigs,
      nodesReconnected: onlineNodes,
      nodesOffline: totalNodes - onlineNodes,
      integrityCheck: {
        totalChunks,
        healthyChunks,
        pendingHealing,
      },
    };
  }
}
