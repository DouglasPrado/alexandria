import type { AlertSeverity } from "../enums/alert-severity";
import type { AlertType } from "../enums/alert-type";

/** Notificacao de problema ou evento importante no cluster. */
export interface Alert {
  id: string;
  clusterId: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  resolved: boolean;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
