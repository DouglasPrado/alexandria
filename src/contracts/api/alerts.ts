import type { AlertType } from '../enums/alert-type';
import type { AlertSeverity } from '../enums/alert-severity';

/** GET /api/alerts */
export interface AlertResponse {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  relatedEntityId: string | null;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

/** PATCH /api/alerts/:id/resolve */
export interface ResolveAlertResponse {
  id: string;
  resolved: boolean;
  resolvedAt: string;
}
