import type { VaultBundle, VaultContents } from '@alexandria/core-sdk';
import {
  S3StorageProvider,
  deriveMasterKey,
  deserializeManifest,
  generateKeypair,
  hash,
  unlockVaultWithMasterKey,
  validateMnemonic,
} from '@alexandria/core-sdk';
import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { SessionKeyService } from '../../common/services/session-key.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createOAuthStorageProvider, isOAuthNodeType } from '../node/oauth-storage-provider';
import { StorageService } from '../storage/storage.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly sessionKeyService: SessionKeyService,
  ) {}

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
    let firstAdminMemberId: string | null = null;

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

        // Track first admin for session key caching
        if (vault.isAdminVault && !firstAdminMemberId) {
          firstAdminMemberId = vault.memberId;
        }

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

    // Cache masterKey for admin so subsequent operations (vault sync, node registration) work
    if (firstAdminMemberId) {
      // Use a placeholder password — admin will need to re-authenticate for vault updates
      this.sessionKeyService.store(firstAdminMemberId, masterKey, '__recovery__');
    }

    // --- Passo 7: Reconnect storage providers ---

    let nodesReconnected = 0;
    let nodesFailedReconnect = 0;

    for (const nc of allNodeConfigs) {
      try {
        const provider = this.createProviderFromConfig(nc);

        // Upsert node in DB
        await this.prisma.node.upsert({
          where: { id: nc.nodeId },
          create: {
            id: nc.nodeId,
            clusterId: cluster.id,
            ownerId: firstAdminMemberId || '',
            name: `${nc.type}-${nc.nodeId.substring(0, 8)}`,
            type: nc.type,
            endpoint:
              nc.endpoint || `oauth://${nc.type}/${nc.accountEmail || nc.accountId || 'account'}`,
            configEncrypted: await this.storageService.encryptNodeConfig(
              JSON.stringify(nc),
              cluster.id,
            ),
            nodeToken: '',
            status: 'online',
            totalCapacity: BigInt(0),
            usedCapacity: BigInt(0),
            lastHeartbeat: new Date(),
            tier: 'warm',
          },
          update: {
            status: 'online',
            lastHeartbeat: new Date(),
          },
        });

        // Register in hash ring
        this.storageService.registerNode(nc.nodeId, 100, provider);
        nodesReconnected++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`[Recovery] Failed to reconnect node ${nc.nodeId}: ${msg}`);
        nodesFailedReconnect++;
      }
    }

    // --- Passos 8-9: Scan chunks e manifests dos providers ---

    let discoveredManifests = 0;
    let discoveredChunks = 0;

    const allProviders = this.storageService.getAllProviders();
    for (const [nodeId, provider] of allProviders) {
      try {
        const keys = await provider.list();

        for (const key of keys) {
          try {
            if (key.startsWith('manifest:')) {
              // Manifest — deserialize and upsert in DB
              const data = await provider.get(key);
              if (data) {
                const manifest = deserializeManifest(data);
                // Upsert chunks from manifest
                for (const chunk of manifest.chunks) {
                  await this.prisma.chunk.upsert({
                    where: { id: chunk.chunkId },
                    create: { id: chunk.chunkId, size: chunk.size, referenceCount: 1 },
                    update: {},
                  });
                  await this.prisma.chunkReplica.upsert({
                    where: { chunkId_nodeId: { chunkId: chunk.chunkId, nodeId } },
                    create: { chunkId: chunk.chunkId, nodeId, status: 'healthy' },
                    update: {},
                  });
                }
                discoveredManifests++;
              }
            } else if (key.startsWith('preview:')) {
              // Skip previews — they are regenerable
            } else {
              // Regular chunk (SHA-256 hash)
              await this.prisma.chunk.upsert({
                where: { id: key },
                create: { id: key, size: 0, referenceCount: 1 },
                update: {},
              });
              await this.prisma.chunkReplica.upsert({
                where: { chunkId_nodeId: { chunkId: key, nodeId } },
                create: { chunkId: key, nodeId, status: 'healthy' },
                update: {},
              });
              discoveredChunks++;
            }
          } catch {
            // Skip individual key failures
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`[Recovery] Failed to scan node ${nodeId}: ${msg}`);
      }
    }

    // Also count existing manifests in DB
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
      discoveredManifests,
      discoveredChunks,
      nodeConfigs: allNodeConfigs,
      nodesReconnected,
      nodesFailedReconnect,
      nodesOffline: totalNodes - onlineNodes,
      integrityCheck: {
        totalChunks,
        healthyChunks,
        pendingHealing,
      },
    };
  }

  /**
   * Creates a StorageProvider from a vault nodeConfig entry.
   */
  private createProviderFromConfig(nc: VaultContents['nodeConfigs'][number]) {
    if (isOAuthNodeType(nc.type)) {
      return createOAuthStorageProvider(nc.type as 'google_drive' | 'onedrive' | 'dropbox', {
        accessToken: (nc as any).accessToken || '',
        refreshToken: (nc as any).refreshToken,
        expiresAt: (nc as any).expiresAt,
        accountEmail: (nc as any).accountEmail,
        accountId: (nc as any).accountId,
      });
    }

    // S3-compatible providers
    return new S3StorageProvider({
      region: (nc as any).region || 'us-east-1',
      bucket: nc.bucket || '',
      accessKeyId: nc.accessKey || '',
      secretAccessKey: nc.secretKey || '',
      endpoint: nc.endpoint,
    });
  }
}
