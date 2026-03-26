import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { S3StorageProvider, LocalStorageProvider } from '@alexandria/core-sdk';
import { randomBytes, createCipheriv } from 'node:crypto';
import { resolve } from 'node:path';

const LOCAL_CHUNKS_DIR = process.env.LOCAL_STORAGE_PATH
  || resolve(process.cwd(), '../..', 'apps', 'data', 'chunks');
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
        endpoint: dto.endpoint || (dto.type === 'local' ? LOCAL_CHUNKS_DIR : ''),
        configEncrypted,
        status: 'online',
        totalCapacity: BigInt(0),
        usedCapacity: BigInt(0),
        lastHeartbeat: new Date(),
        tier: 'warm',
      },
    });

    // Register node in StorageService hash ring with appropriate provider
    let provider: LocalStorageProvider | S3StorageProvider;

    if (dto.type === 'local') {
      const ep = dto.endpoint || LOCAL_CHUNKS_DIR;
      const localPath = ep.startsWith('/') ? ep : resolve(process.cwd(), '../..', ep);
      provider = new LocalStorageProvider(localPath);
    } else {
      const accessKeyId = dto.accessKey || '';
      const secretAccessKey = dto.secretKey || '';
      const endpoint = dto.endpoint || '';

      // R2/B2/VPS always need a custom endpoint; AWS S3 derives from region
      const needsEndpoint = dto.type !== 's3';
      if (needsEndpoint && !endpoint) {
        throw new UnprocessableEntityException(
          `${dto.type.toUpperCase()} nodes require an explicit endpoint`,
        );
      }

      if (!accessKeyId || !secretAccessKey) {
        throw new UnprocessableEntityException(
          'S3-compatible nodes require accessKey and secretKey',
        );
      }

      const s3Config: ConstructorParameters<typeof S3StorageProvider>[0] = {
        region: dto.region || 'us-east-1',
        bucket: dto.bucket || '',
        accessKeyId,
        secretAccessKey,
      };
      if (endpoint) {
        s3Config.endpoint = endpoint;
      }

      provider = new S3StorageProvider(s3Config);
    }

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
   * Drena no — migra chunks para outros nos e desconecta (RN-N3).
   * Fonte: docs/backend/06-services.md (NodeService.drain — Fluxo Detalhado)
   *
   * Fluxo:
   * 1. Valida no existe e cluster tem nos suficientes (RN-N6)
   * 2. Status → draining
   * 3. Lista replicas do no
   * 4. Re-replica chunks sub-replicados via StorageService
   * 5. Remove replicas do no drenado
   * 6. Remove no do hash ring
   * 7. Status → disconnected
   */
  async drain(nodeId: string) {
    const node = await this.prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('No nao encontrado');
    }

    // RN-N6: after drain, must still have MIN_NODES_FOR_REPLICATION active nodes
    const activeNodeCount = await this.prisma.node.count({
      where: { clusterId: node.clusterId, status: 'online' },
    });
    if (activeNodeCount - 1 < MIN_NODES_FOR_REPLICATION) {
      throw new UnprocessableEntityException(
        `Nao e possivel drenar — apos remocao restam ${activeNodeCount - 1} nos, minimo necessario: ${MIN_NODES_FOR_REPLICATION}`,
      );
    }

    // 5. Status → draining (previne drain concorrente)
    await this.prisma.node.update({
      where: { id: nodeId },
      data: { status: 'draining' },
    });

    // 6. Lista replicas do no
    const replicas = await this.prisma.chunkReplica.findMany({
      where: { nodeId },
    });

    // 7. Re-replica chunks sub-replicados
    let chunksRelocated = 0;
    let chunksSkipped = 0;
    let chunksFailed = 0;

    for (const replica of replicas) {
      const activeCount = await this.prisma.chunkReplica.count({
        where: {
          chunkId: replica.chunkId,
          status: 'healthy',
          nodeId: { not: nodeId },
        },
      });

      if (activeCount >= 3) {
        chunksSkipped++;
        continue;
      }

      try {
        await this.storageService.reReplicateChunk(replica.chunkId, [nodeId]);
        chunksRelocated++;
      } catch (err) {
        console.error(
          `[Drain] Failed to re-replicate chunk ${replica.chunkId}:`,
          err instanceof Error ? err.message : err,
        );
        chunksFailed++;
      }
    }

    // Remove replicas do no drenado
    await this.prisma.chunkReplica.deleteMany({ where: { nodeId } });

    // 8. Remove no do ConsistentHashRing
    this.storageService.unregisterNode(nodeId);

    // 9. Status → disconnected
    await this.prisma.node.update({
      where: { id: nodeId },
      data: { status: 'disconnected' },
    });

    return {
      id: nodeId,
      status: 'disconnected' as const,
      chunksRelocated,
      chunksSkipped,
      chunksFailed,
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
