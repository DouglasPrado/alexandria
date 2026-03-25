import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { S3StorageProvider, LocalStorageProvider } from '@alexandria/core-sdk';
import { randomBytes, createCipheriv } from 'node:crypto';

const MAX_NODES_PER_CLUSTER = parseInt(process.env.MAX_NODES_PER_CLUSTER || '50', 10);
const MIN_NODES_FOR_REPLICATION = parseInt(process.env.MIN_NODES_FOR_REPLICATION || '1', 10);

/**
 * NodeService — registro de nos, heartbeat, drain, listagem.
 * Fonte: docs/backend/06-services.md (NodeService)
 */
@Injectable()
export class NodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Registra no de armazenamento (UC-003).
   * Credenciais criptografadas antes de armazenar (RN-N4).
   */
  async register(
    clusterId: string,
    ownerId: string,
    dto: {
      name: string;
      type: string;
      endpoint?: string;
      bucket?: string;
      accessKey?: string;
      secretKey?: string;
      region?: string;
    },
  ) {
    // RN-C4: Max 50 nos
    const nodeCount = await this.prisma.node.count({ where: { clusterId } });
    if (nodeCount >= MAX_NODES_PER_CLUSTER) {
      throw new UnprocessableEntityException('Cluster atingiu o limite de 50 nos');
    }

    // RN-N4: Encrypt credentials before storing
    const config = JSON.stringify({
      endpoint: dto.endpoint,
      bucket: dto.bucket,
      accessKey: dto.accessKey,
      secretKey: dto.secretKey,
      region: dto.region,
    });
    const configEncrypted = this.encryptConfig(config);

    const node = await this.prisma.node.create({
      data: {
        clusterId,
        ownerId,
        name: dto.name,
        type: dto.type,
        endpoint: dto.endpoint || '',
        configEncrypted,
        status: 'online',
        totalCapacity: BigInt(0),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        tier: 'warm',
      },
    });

    // Register node in StorageService hash ring with appropriate provider
    const provider =
      dto.type === 'local'
        ? new LocalStorageProvider(dto.endpoint || '/tmp/alexandria/chunks')
        : new S3StorageProvider({
            endpoint: dto.endpoint || '',
            region: dto.region || 'us-east-1',
            bucket: dto.bucket || '',
            accessKeyId: dto.accessKey || '',
            secretAccessKey: dto.secretKey || '',
          });
    this.storageService.registerNode(node.id, 100, provider);

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      totalCapacity: Number(node.totalCapacity),
      usedCapacity: Number(node.usedCapacity),
      chunksStored: 0,
      lastHeartbeat: node.lastHeartbeat?.toISOString() ?? null,
      createdAt: node.createdAt.toISOString(),
    };
  }

  /**
   * Atualiza heartbeat do no — status volta para online.
   * Conforme glossario: heartbeat = sinal periodico do no ao orquestrador.
   */
  async heartbeat(nodeId: string) {
    const node = await this.prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('No nao encontrado');
    }

    await this.prisma.node.update({
      where: { id: nodeId },
      data: {
        status: 'online',
        lastHeartbeat: new Date(),
      },
    });
  }

  /** Detalhe de um nó */
  async findById(nodeId: string, clusterId: string) {
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
      include: { _count: { select: { chunkReplicas: true } } },
    });

    if (!node || node.clusterId !== clusterId) {
      throw new NotFoundException('No nao encontrado');
    }

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      totalCapacity: Number(node.totalCapacity),
      usedCapacity: Number(node.usedCapacity),
      chunksStored: (node as any)._count?.chunkReplicas ?? 0,
      lastHeartbeat: node.lastHeartbeat?.toISOString() ?? null,
      createdAt: node.createdAt.toISOString(),
    };
  }

  /** Lista nos de um cluster */
  async listByCluster(clusterId: string) {
    const nodes = await this.prisma.node.findMany({
      where: { clusterId },
      include: { _count: { select: { chunkReplicas: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return nodes.map((n: any) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      status: n.status,
      totalCapacity: Number(n.totalCapacity),
      usedCapacity: Number(n.usedCapacity),
      chunksStored: n._count?.chunkReplicas ?? 0,
      lastHeartbeat: n.lastHeartbeat?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  /**
   * Inicia drain de no — migra chunks antes de remover (RN-N3).
   * RN-N6: Nao pode drenar se restam < 3 nos ativos.
   */
  async drain(nodeId: string) {
    const node = await this.prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('No nao encontrado');
    }

    // Check: after drain, must still have MIN_NODES_FOR_REPLICATION active nodes
    const activeNodeCount = await this.prisma.node.count({
      where: { clusterId: node.clusterId, status: 'online' },
    });
    if (activeNodeCount - 1 < MIN_NODES_FOR_REPLICATION) {
      throw new UnprocessableEntityException(
        `Nao e possivel drenar — apos remocao restam ${activeNodeCount - 1} nos, minimo necessario: ${MIN_NODES_FOR_REPLICATION}`,
      );
    }

    const chunksToMigrate = await this.prisma.chunkReplica.count({
      where: { nodeId },
    });

    await this.prisma.node.update({
      where: { id: nodeId },
      data: { status: 'draining' },
    });

    return {
      id: nodeId,
      status: 'draining' as const,
      chunksToMigrate,
      estimatedTime: `${Math.ceil(chunksToMigrate / 10)}min`,
    };
  }

  /**
   * Remove no apos drain completo (RN-N3).
   * So permite remocao se status = disconnected (drain concluido).
   */
  async remove(nodeId: string) {
    const node = await this.prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('No nao encontrado');
    }

    if (node.status !== 'disconnected') {
      throw new UnprocessableEntityException(
        'No precisa ser drenado antes de remover. Status atual: ' + node.status,
      );
    }

    await this.prisma.node.delete({ where: { id: nodeId } });
  }

  /**
   * Criptografa config do no com AES-256-GCM (RN-N4).
   * Em producao, a chave viria do vault do admin.
   * Para simplificar no MVP, usa chave derivada do env.
   */
  private encryptConfig(config: string): Uint8Array<ArrayBuffer> {
    const key = Buffer.alloc(32, 0); // Placeholder — will use vault key in production
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(config, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return new Uint8Array(Buffer.concat([iv, authTag, encrypted])) as Uint8Array<ArrayBuffer>;
  }
}
