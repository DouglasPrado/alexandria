import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';

export interface ScrubResult {
  verified: number;
  corrupted: number;
  repaired: number;
  skipped: number;
  irrecoverable: number;
}

export interface GCResult {
  chunksRemoved: number;
  replicasRemoved: number;
  spaceFreed: number;
}

const SUSPECT_THRESHOLD_MS = 30 * 60 * 1000; // 30 min (RN-N1)
const LOST_THRESHOLD_MS = 60 * 60 * 1000; // 1h (RN-N2)

/**
 * HealthService — alertas, heartbeat monitoring, auto-healing, liveness/readiness.
 * Fonte: docs/backend/06-services.md (HealthService)
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StorageService))
    private readonly storageService: StorageService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Cria alerta de condicao anomala (RN-A1).
   */
  async createAlert(data: {
    clusterId: string;
    type: string;
    severity: string;
    message: string;
    relatedEntityId?: string | null;
  }) {
    const alert = await this.prisma.alert.create({
      data: {
        clusterId: data.clusterId,
        type: data.type,
        severity: data.severity,
        message: data.message,
        relatedEntityId: data.relatedEntityId ?? null,
        resolved: false,
      },
    });

    return {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      relatedEntityId: alert.relatedEntityId,
      resolved: alert.resolved,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: null,
    };
  }

  /**
   * Resolve alerta (RN-A2: persistem ate resolucao).
   */
  async resolveAlert(alertId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException('Alerta nao encontrado');
    }
    if (alert.resolved) {
      throw new UnprocessableEntityException('Alerta ja resolvido');
    }

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      resolved: updated.resolved,
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    };
  }

  /**
   * Lista alertas de um cluster com filtro opcional.
   */
  async listAlerts(clusterId: string, filter?: { resolved?: boolean }) {
    const where: Record<string, unknown> = { clusterId };
    if (filter?.resolved !== undefined) {
      where.resolved = filter.resolved;
    }

    const alerts = await this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((a: any) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      message: a.message,
      relatedEntityId: a.relatedEntityId,
      resolved: a.resolved,
      createdAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
    }));
  }

  /**
   * Verifica heartbeats de todos os nos.
   * RN-N1: 30min sem heartbeat → suspect + alerta warning
   * RN-N2: 1h sem heartbeat → lost + alerta critical
   */
  async checkHeartbeats(): Promise<{
    suspect: number;
    lost: number;
    lostNodes: Array<{ id: string; clusterId: string; name: string }>;
  }> {
    const now = Date.now();
    let suspect = 0;
    let lost = 0;
    const lostNodes: Array<{ id: string; clusterId: string; name: string }> = [];

    // Find online nodes overdue for suspect
    const suspectCandidates = await this.prisma.node.findMany({
      where: {
        status: 'online',
        lastHeartbeat: { lt: new Date(now - SUSPECT_THRESHOLD_MS) },
      },
    });

    for (const node of suspectCandidates) {
      await this.prisma.node.update({
        where: { id: node.id },
        data: { status: 'suspect' },
      });
      await this.createAlert({
        clusterId: node.clusterId,
        type: 'node_offline',
        severity: 'warning',
        message: `No "${node.name}" sem heartbeat ha 30 minutos`,
        relatedEntityId: node.id,
      });
      suspect++;
    }

    // Find suspect nodes overdue for lost
    const lostCandidates = await this.prisma.node.findMany({
      where: {
        status: 'suspect',
        lastHeartbeat: { lt: new Date(now - LOST_THRESHOLD_MS) },
      },
    });

    for (const node of lostCandidates) {
      await this.prisma.node.update({
        where: { id: node.id },
        data: { status: 'lost' },
      });
      await this.createAlert({
        clusterId: node.clusterId,
        type: 'node_offline',
        severity: 'critical',
        message: `No "${node.name}" perdido — sem heartbeat ha 1 hora. Auto-healing necessario.`,
        relatedEntityId: node.id,
      });

      // Notifica admin(s) do cluster por email (fire-and-forget)
      (async () => {
        const [admins, c] = await Promise.all([
          this.prisma.member.findMany({ where: { clusterId: node.clusterId, role: 'admin' } }),
          this.prisma.cluster.findUnique({ where: { id: node.clusterId } }),
        ]);
        const clusterName = c?.name ?? 'Cluster';
        for (const admin of admins) {
          await this.notifications.sendNodeLostAlert({
            to: admin.email,
            adminName: admin.name,
            nodeName: node.name,
            nodeType: (node as any).type ?? 'local',
            chunksAffected: 0,
            clusterName,
          });
        }
      })().catch(() => {});

      lostNodes.push({ id: node.id, clusterId: node.clusterId, name: node.name });
      lost++;
    }

    return { suspect, lost, lostNodes };
  }

  /**
   * Auto-healing: re-replica chunks sub-replicados de um no perdido.
   * Fonte: docs/backend/06-services.md (HealthService.autoHeal)
   * Fonte: docs/blueprint/07-critical_flows.md (Auto-Healing — No Perdido)
   *
   * Fluxo:
   * 1. Lista replicas do no perdido
   * 2. Para cada chunk: conta replicas ativas restantes
   * 3. Se < 3: re-replica via StorageService.reReplicateChunk
   * 4. Remove replicas do no perdido
   * 5. Resolve alerta do no e cria alerta de conclusao
   *
   * Idempotente: chunks ja com 3+ replicas sao ignorados.
   */
  async autoHeal(
    nodeId: string,
    clusterId: string,
  ): Promise<{ chunksHealed: number; chunksSkipped: number; chunksFailed: number }> {
    let chunksHealed = 0;
    let chunksSkipped = 0;
    let chunksFailed = 0;

    // 1. Lista todas as replicas do no perdido
    const lostReplicas = await this.prisma.chunkReplica.findMany({
      where: { nodeId },
    });

    // 2-3. Para cada chunk, verificar e re-replicar se necessario
    for (const replica of lostReplicas) {
      // Conta replicas saudaveis excluindo o no perdido
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

      // Re-replicar
      try {
        await this.storageService.reReplicateChunk(replica.chunkId, [nodeId]);
        chunksHealed++;
      } catch (err) {
        console.error(
          `[AutoHeal] Failed to re-replicate chunk ${replica.chunkId}:`,
          err instanceof Error ? err.message : err,
        );
        chunksFailed++;
      }
    }

    // 4. Remove replicas do no perdido
    await this.prisma.chunkReplica.deleteMany({ where: { nodeId } });

    // 5. Resolve alerta node_offline existente (RN-A3)
    const existingAlert = await this.prisma.alert.findFirst({
      where: {
        relatedEntityId: nodeId,
        resolved: false,
        type: 'node_offline',
      },
    });

    if (existingAlert) {
      await this.prisma.alert.update({
        where: { id: existingAlert.id },
        data: { resolved: true, resolvedAt: new Date() },
      });
    }

    // 6. Cria alerta de conclusao
    await this.createAlert({
      clusterId,
      type: 'auto_healing_complete',
      severity: 'info',
      message: `Auto-healing concluido para no ${nodeId}: ${chunksHealed} chunks re-replicados, ${chunksSkipped} ja replicados, ${chunksFailed} falhas.`,
      relatedEntityId: nodeId,
    });

    return { chunksHealed, chunksSkipped, chunksFailed };
  }

  /**
   * Scrubbing: verificacao periodica de integridade de chunks via SHA-256.
   * Fonte: docs/blueprint/07-critical_flows.md (Scrubbing e Verificacao de Integridade)
   * Fonte: docs/backend/06-services.md (HealthService.scrub)
   *
   * Fluxo:
   * 1. Seleciona batch de replicas ordenado por verified_at ASC NULLS FIRST
   * 2. Para cada: le chunk do no, recalcula SHA-256, compara com chunk_id
   * 3. Se match: atualiza verified_at (RN-CR3)
   * 4. Se mismatch: marca corrompida, tenta reparar com replica saudavel (RN-CR4)
   * 5. Se irrecuperavel: cria alerta critico
   */
  async scrub(batchSize: number): Promise<ScrubResult> {
    let verified = 0;
    let corrupted = 0;
    let repaired = 0;
    let skipped = 0;
    let irrecoverable = 0;

    // 1. Seleciona batch priorizando replicas nunca verificadas
    const replicas = await this.prisma.chunkReplica.findMany({
      where: { status: 'healthy' },
      orderBy: { verifiedAt: { sort: 'asc', nulls: 'first' } },
      take: batchSize,
    });

    for (const replica of replicas) {
      // 2. Le chunk do no
      let chunkData: Buffer;
      try {
        chunkData = await this.storageService.getFromNode(replica.nodeId, replica.chunkId);
      } catch {
        // No offline — skip, sera verificada no proximo ciclo
        skipped++;
        continue;
      }

      // 3. Recalcula SHA-256 e compara com chunk_id
      const computedHash = createHash('sha256').update(chunkData).digest('hex');

      if (computedHash === replica.chunkId) {
        // Hash confere — atualiza verified_at
        await this.prisma.chunkReplica.update({
          where: { id: replica.id },
          data: { verifiedAt: new Date() },
        });
        verified++;
        continue;
      }

      // 4. Hash NAO confere — replica corrompida
      corrupted++;
      await this.prisma.chunkReplica.update({
        where: { id: replica.id },
        data: { status: 'corrupted' },
      });

      // Tentar reparar com replica saudavel de outro no
      const healthyReplicas = await this.prisma.chunkReplica.findMany({
        where: {
          chunkId: replica.chunkId,
          status: 'healthy',
          id: { not: replica.id },
        },
      });

      if (healthyReplicas.length === 0) {
        // Nenhuma replica saudavel — chunk irrecuperavel
        irrecoverable++;
        await this.createAlert({
          clusterId: await this.getClusterIdForChunk(replica.chunkId),
          type: 'corruption_detected',
          severity: 'critical',
          message: `Chunk ${replica.chunkId.slice(0, 16)}... irrecuperavel — todas as replicas corrompidas.`,
          relatedEntityId: replica.chunkId,
        });
        continue;
      }

      // Reparar: ler de replica saudavel e sobrescrever
      try {
        const sourceReplica = healthyReplicas[0]!;
        const goodData = await this.storageService.getFromNode(
          sourceReplica.nodeId,
          replica.chunkId,
        );

        // Verificar que a replica fonte esta de fato saudavel
        const sourceHash = createHash('sha256').update(goodData).digest('hex');
        if (sourceHash !== replica.chunkId) {
          // Replica fonte tambem corrompida — marcar e pular
          irrecoverable++;
          continue;
        }

        // Sobrescrever replica corrompida
        await this.storageService.storeInNode(replica.chunkId, goodData);

        // Restaurar status
        await this.prisma.chunkReplica.update({
          where: { id: replica.id },
          data: { status: 'healthy', verifiedAt: new Date() },
        });

        repaired++;

        await this.createAlert({
          clusterId: await this.getClusterIdForChunk(replica.chunkId),
          type: 'corruption_detected',
          severity: 'warning',
          message: `Chunk ${replica.chunkId.slice(0, 16)}... corrompido no no ${replica.nodeId.slice(0, 8)}... — reparado automaticamente.`,
          relatedEntityId: replica.chunkId,
        });
      } catch {
        irrecoverable++;
      }
    }

    return { verified, corrupted, repaired, skipped, irrecoverable };
  }

  /**
   * Garbage Collection: remove chunks orfaos (referenceCount = 0).
   * Fonte: docs/backend/06-services.md (HealthService.garbageCollect)
   * Fonte: docs/backend/12-events.md (GarbageCollection — diario as 04:00)
   *
   * Chunk orfao: nenhum manifest referencia (referenceCount decrementado ao deletar arquivo).
   * Fluxo:
   * 1. Query chunks WHERE reference_count = 0
   * 2. Para cada: deletar dados dos nos via StorageProvider
   * 3. Deletar registros de chunk_replicas e chunks do banco
   */
  async garbageCollect(): Promise<GCResult> {
    // 1. Encontrar chunks orfaos
    const orphanChunks = await this.prisma.chunk.findMany({
      where: { referenceCount: 0 },
    });

    if (orphanChunks.length === 0) {
      return { chunksRemoved: 0, replicasRemoved: 0, spaceFreed: 0 };
    }

    const orphanIds = orphanChunks.map((c) => c.id);

    // 2. Encontrar todas as replicas dos chunks orfaos
    const replicas = await this.prisma.chunkReplica.findMany({
      where: { chunkId: { in: orphanIds } },
    });

    // 3. Deletar dados dos nos via StorageProvider (best-effort)
    for (const replica of replicas) {
      try {
        await this.storageService.deleteFromNode(replica.nodeId, replica.chunkId);
      } catch {
        // No pode estar offline — GC continua, dados serao limpos eventualmente
      }
    }

    // 4. Deletar registros do banco
    const replicaResult = await this.prisma.chunkReplica.deleteMany({
      where: { chunkId: { in: orphanIds } },
    });

    const chunkResult = await this.prisma.chunk.deleteMany({
      where: { id: { in: orphanIds } },
    });

    const spaceFreed = orphanChunks.reduce((acc, c) => acc + c.size, 0);

    return {
      chunksRemoved: chunkResult.count,
      replicasRemoved: replicaResult.count,
      spaceFreed,
    };
  }

  /** Helper: encontra clusterId a partir de um chunkId via manifest → file → cluster */
  private async getClusterIdForChunk(chunkId: string): Promise<string> {
    const manifestChunk = await this.prisma.manifestChunk?.findFirst?.({
      where: { chunkId },
      include: { manifest: { include: { file: true } } },
    });
    return manifestChunk?.manifest?.file?.clusterId ?? 'unknown';
  }

  /** Liveness probe — processo ativo */
  live() {
    return { status: 'ok' as const };
  }

  /** Readiness probe enriquecida — verifica dependencias + info do cluster (OBS-R1, OBS-R2, OBS-R3) */
  async ready() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch {
      checks.database = 'error';
    }

    // Redis check would go here when ioredis is wired
    checks.redis = 'up'; // stub

    const allUp = Object.values(checks).every((v) => v === 'up');

    // Cluster info — best-effort (falhas nao afetam status)
    let cluster: {
      nodes_online: number;
      files_total: number;
      replication_health: 'healthy' | 'degraded' | 'unknown';
    } = { nodes_online: 0, files_total: 0, replication_health: 'unknown' };

    try {
      const [nodesOnline, filesTotal, subReplicated] = await Promise.all([
        this.prisma.node.count({ where: { status: 'online' } }),
        this.prisma.file.count(),
        this.prisma.chunkReplica.groupBy({
          by: ['chunkId'],
          having: { chunkId: { _count: { lt: 3 } } },
        }),
      ]);

      cluster = {
        nodes_online: nodesOnline,
        files_total: filesTotal,
        replication_health: subReplicated.length === 0 ? 'healthy' : 'degraded',
      };
    } catch {
      // cluster info unavailable — nao altera status geral
    }

    const packageVersion = process.env.npm_package_version ?? '0.0.0';

    return {
      status: allUp ? ('ok' as const) : ('degraded' as const),
      checks,
      uptime_seconds: Math.floor(process.uptime()),
      version: packageVersion,
      cluster,
    };
  }

  /**
   * Metricas operacionais do cluster — endpoint JSON para observabilidade.
   * Fonte: docs/blueprint/15-observability.md
   */
  async getMetrics(): Promise<{
    nodes_online: number;
    nodes_suspect: number;
    files_total: number;
    storage_usage_percent: number;
    chunks_sub_replicated: number;
  }> {
    const [nodesOnline, nodesSuspect, filesTotal, storageAgg, subReplicated] = await Promise.all([
      this.prisma.node.count({ where: { status: 'online' } }),
      this.prisma.node.count({ where: { status: 'suspect' } }),
      this.prisma.file.count(),
      this.prisma.node.aggregate({
        _sum: { totalCapacity: true, usedCapacity: true },
      }),
      this.prisma.chunkReplica.groupBy({
        by: ['chunkId'],
        having: { chunkId: { _count: { lt: 3 } } },
      }),
    ]);

    const capacity = Number(storageAgg._sum?.totalCapacity ?? 0);
    const used = Number(storageAgg._sum?.usedCapacity ?? 0);
    const storageUsagePercent = capacity > 0 ? Math.round((used / capacity) * 100) : 0;

    return {
      nodes_online: nodesOnline,
      nodes_suspect: nodesSuspect,
      files_total: filesTotal,
      storage_usage_percent: storageUsagePercent,
      chunks_sub_replicated: subReplicated.length,
    };
  }
}
