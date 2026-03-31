import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEventService } from '../../common/events';
import {
  generateMnemonic,
  deriveMasterKey,
  generateKeypair,
  hash,
  encrypt,
  createVault,
} from '@alexandria/core-sdk';
import * as argon2 from 'argon2';
import { SessionKeyService } from '../../common/services/session-key.service';

interface CreateClusterInput {
  name: string;
  admin: {
    name: string;
    email: string;
    password: string;
  };
}

/**
 * ClusterService — criacao de clusters familiares com identidade criptografica.
 * Fonte: docs/backend/06-services.md (ClusterService)
 *
 * Fluxo create(): seed phrase → master key → keypair → cluster_id → admin + vault
 */
@Injectable()
export class ClusterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionKeyService: SessionKeyService,
    @Optional() private readonly events?: DomainEventService,
  ) {}

  /**
   * Cria cluster familiar com identidade criptografica derivada de BIP-39.
   * Conforme backend/06-services.md — ClusterService.create() fluxo detalhado.
   *
   * Passos: generateMnemonic → deriveMasterKey → generateKeypair → SHA-256(publicKey)
   *         → encrypt(privateKey) → $transaction(cluster + admin + vault)
   */
  async create(dto: CreateClusterInput) {
    // 1-2. Generate and validate BIP-39 seed phrase
    const seedPhrase = generateMnemonic();

    // 3. Derive master key from seed phrase
    const masterKey = deriveMasterKey(seedPhrase);

    // 4. Generate Ed25519 keypair
    const { publicKey, privateKey } = generateKeypair(masterKey);

    // 5. Calculate cluster_id = SHA-256(public_key) (RN-C1)
    const clusterId = hash(Buffer.from(publicKey));

    // 6. Encrypt private key with master key
    const encryptedPrivateKey = encrypt(Buffer.from(privateKey), masterKey);
    const encryptedPrivateKeyBuffer = Buffer.concat([
      encryptedPrivateKey.iv,
      encryptedPrivateKey.authTag,
      encryptedPrivateKey.ciphertext,
    ]);

    // 7. Hash admin password with Argon2id
    const passwordHash = await argon2.hash(dto.admin.password);

    // 8. Create admin vault data
    const vaultContents = {
      credentials: { email: dto.admin.email, role: 'admin' },
      nodeConfigs: [],
      clusterConfig: { name: dto.name, nodeList: [] },
    };
    const vaultBundle = createVault(vaultContents, dto.admin.password, masterKey);

    // 9-11. Transaction: cluster + admin member + vault
    const result = await this.prisma.$transaction(async (tx) => {
      const cluster = await tx.cluster.create({
        data: {
          clusterId,
          name: dto.name,
          publicKey: new Uint8Array(publicKey) as Uint8Array<ArrayBuffer>,
          encryptedPrivateKey: new Uint8Array(encryptedPrivateKeyBuffer) as Uint8Array<ArrayBuffer>,
          status: 'active',
        },
      });

      const member = await tx.member.create({
        data: {
          clusterId: cluster.id,
          name: dto.admin.name,
          email: dto.admin.email,
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

      return { cluster, member };
    });

    // 12. Cache master key for vault updates during this session
    this.sessionKeyService.store(result.member.id, masterKey, dto.admin.password);

    // 13. Emit domain event
    this.events?.emit({
      type: 'ClusterCreated',
      clusterId: result.cluster.id,
      adminMemberId: result.member.id,
      timestamp: new Date(),
    });

    // 13. Return cluster + member + seed phrase (shown ONCE)
    return {
      cluster: {
        id: result.cluster.id,
        name: result.cluster.name,
        status: result.cluster.status,
        createdAt: result.cluster.createdAt.toISOString(),
      },
      member: {
        id: result.member.id,
        name: result.member.name,
        email: result.member.email,
        role: result.member.role,
      },
      seedPhrase,
    };
  }

  /**
   * Retorna detalhes do cluster com contadores agregados.
   * Conforme backend/05-api-contracts.md — GET /api/clusters/:id
   */
  async findById(id: string) {
    const cluster = await this.prisma.cluster.findUnique({ where: { id } });

    if (!cluster) {
      throw new NotFoundException('Cluster nao encontrado');
    }

    const [totalNodes, totalFiles, nodeAgg] = await Promise.all([
      this.prisma.node.count({ where: { clusterId: id } }),
      this.prisma.file.count({ where: { clusterId: id } }),
      this.prisma.node.aggregate({
        where: { clusterId: id },
        _sum: { totalCapacity: true, usedCapacity: true },
      }),
    ]);

    const totalStorage = Number(nodeAgg._sum.totalCapacity ?? 0);
    const usedStorage = Number(nodeAgg._sum.usedCapacity ?? 0);

    return {
      id: cluster.id,
      name: cluster.name,
      status: cluster.status,
      totalNodes,
      totalFiles,
      totalStorage,
      usedStorage,
      replicationFactor: 3,
      createdAt: cluster.createdAt.toISOString(),
    };
  }

  /**
   * Suspende um cluster (active → suspended).
   * Fonte: docs/blueprint/09-state-models.md, docs/backend/03-domain.md
   */
  async suspend(id: string) {
    const cluster = await this.prisma.cluster.findUnique({ where: { id } });
    if (!cluster) throw new NotFoundException('Cluster nao encontrado');
    if (cluster.status !== 'active') {
      throw new NotFoundException('Cluster precisa estar ativo para suspender');
    }
    await this.prisma.cluster.update({ where: { id }, data: { status: 'suspended' } });
    return { id, status: 'suspended' };
  }

  /**
   * Reativa um cluster (suspended → active).
   * Fonte: docs/blueprint/09-state-models.md, docs/backend/03-domain.md
   */
  async activate(id: string) {
    const cluster = await this.prisma.cluster.findUnique({ where: { id } });
    if (!cluster) throw new NotFoundException('Cluster nao encontrado');
    if (cluster.status !== 'suspended') {
      throw new NotFoundException('Cluster precisa estar suspenso para ativar');
    }
    await this.prisma.cluster.update({ where: { id }, data: { status: 'active' } });
    return { id, status: 'active' };
  }
}
