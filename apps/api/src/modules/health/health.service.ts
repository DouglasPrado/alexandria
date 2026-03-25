import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const SUSPECT_THRESHOLD_MS = 30 * 60 * 1000; // 30 min (RN-N1)
const LOST_THRESHOLD_MS = 60 * 60 * 1000; // 1h (RN-N2)

/**
 * HealthService — alertas, heartbeat monitoring, liveness/readiness.
 * Fonte: docs/backend/06-services.md (HealthService)
 */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

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
  async checkHeartbeats(): Promise<{ suspect: number; lost: number }> {
    const now = Date.now();
    let suspect = 0;
    let lost = 0;

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
      lost++;
    }

    return { suspect, lost };
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
