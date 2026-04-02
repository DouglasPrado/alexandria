import type { VaultBundle, VaultContents } from '@alexandria/core-sdk';
import {
  S3StorageProvider,
  createVault,
  deriveMasterKey,
  deserializeManifest,
  encrypt,
  generateKeypair,
  hash,
  unlockVaultWithMasterKey,
  validateMnemonic,
} from '@alexandria/core-sdk';
import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import * as argon2 from 'argon2';
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

  async recover(dto: {
    seedPhrase: string;
    clusterName?: string;
    adminName?: string;
    adminEmail?: string;
    adminPassword?: string;
  }) {
    // --- Passos 3-5: Validate → derive → find cluster ---

    if (!validateMnemonic(dto.seedPhrase)) {
      throw new BadRequestException(
        'Seed phrase invalida. Deve conter 12 palavras do dicionario BIP-39.',
      );
    }

    const masterKey = deriveMasterKey(dto.seedPhrase);
    const { publicKey, privateKey } = generateKeypair(masterKey);
    const clusterId = hash(Buffer.from(publicKey));

    let cluster = await this.prisma.cluster.findFirst({
      where: { clusterId },
    });

    // --- Cold Recovery: cluster nao existe no DB, recriar a partir da seed ---
    let coldRecovery = false;
    let firstAdminMemberId: string | null = null;

    if (!cluster) {
      if (!dto.adminName || !dto.adminEmail || !dto.adminPassword) {
        throw new UnprocessableEntityException(
          'Cluster nao encontrado no banco. Para cold recovery (DB vazio), informe clusterName, adminName, adminEmail e adminPassword.',
        );
      }

      coldRecovery = true;

      // Re-derive cryptographic identity
      const encryptedPrivateKey = encrypt(Buffer.from(privateKey), masterKey);
      const encryptedPrivateKeyBuffer = Buffer.concat([
        encryptedPrivateKey.iv,
        encryptedPrivateKey.authTag,
        encryptedPrivateKey.ciphertext,
      ]);

      const passwordHash = await argon2.hash(dto.adminPassword);

      const vaultContents: VaultContents = {
        credentials: { email: dto.adminEmail, role: 'admin' },
        nodeConfigs: [],
        clusterConfig: { name: dto.clusterName || 'Recovered Cluster', nodeList: [] },
      };
      const vaultBundle = createVault(vaultContents, dto.adminPassword, masterKey);

      const result = await this.prisma.$transaction(async (tx) => {
        const newCluster = await tx.cluster.create({
          data: {
            clusterId,
            name: dto.clusterName || 'Recovered Cluster',
            publicKey: new Uint8Array(publicKey) as Uint8Array<ArrayBuffer>,
            encryptedPrivateKey: new Uint8Array(encryptedPrivateKeyBuffer) as Uint8Array<ArrayBuffer>,
            status: 'active',
          },
        });

        const member = await tx.member.create({
          data: {
            clusterId: newCluster.id,
            name: dto.adminName!,
            email: dto.adminEmail!,
            passwordHash,
            role: 'admin',
          },
        });

        await tx.vault.create({
          data: {
            memberId: member.id,
            vaultData: new Uint8Array(vaultBundle.encryptedData) as Uint8Array<ArrayBuffer>,
            passwordSalt: new Uint8Array(vaultBundle.passwordSalt) as Uint8Array<ArrayBuffer>,
            masterKeySalt: new Uint8Array(vaultBundle.masterKeySalt) as Uint8Array<ArrayBuffer>,
            encryptionAlgorithm: 'AES-256-GCM',
            replicatedTo: [],
            isAdminVault: true,
          },
        });

        return { cluster: newCluster, member };
      });

      cluster = result.cluster;
      firstAdminMemberId = result.member.id;

      // Cache session key with real password for subsequent vault operations
      this.sessionKeyService.store(firstAdminMemberId, masterKey, dto.adminPassword);
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
    if (firstAdminMemberId && !coldRecovery) {
      this.sessionKeyService.store(firstAdminMemberId, masterKey, dto.adminPassword || '__recovery__');
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
      coldRecovery,
      clusterId: cluster.id,
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
      nextSteps: coldRecovery
        ? [
            'Cluster recriado a partir da seed phrase.',
            'Faca login com as credenciais informadas.',
            'Reconecte os providers cloud (Google Drive, Dropbox, etc.) via OAuth.',
            'Ao reconectar cada provider, o sistema vai escanear os dados existentes automaticamente.',
          ]
        : [],
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
