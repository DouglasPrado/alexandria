import type { AlertType } from '../enums/alert-type';
import type { AlertSeverity } from '../enums/alert-severity';

/**
 * Alert — Notificacao de condicao anomala no cluster.
 * Gerada automaticamente pelo Scheduler ou por eventos (RN-A1).
 * Persiste ate resolucao — sem expiracao automatica (RN-A2).
 * Auto-healing pode resolver alertas automaticamente (RN-A3).
 */
export interface Alert {
  id: string;
  clusterId: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  resolved: boolean;
  relatedEntityId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}
