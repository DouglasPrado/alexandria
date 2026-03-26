import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

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

  /** Liveness probe — processo ativo */
  live() {
    return { status: 'ok' as const };
  }

  /** Readiness probe — verifica dependencias */
  async ready() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }

    // Redis check would go here when ioredis is wired
    checks.redis = 'up'; // stub

    const allUp = Object.values(checks).every((v) => v === 'up');

    return {
      status: allUp ? ('ok' as const) : ('degraded' as const),
      checks,
    };
  }
}
