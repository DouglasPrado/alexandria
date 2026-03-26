/**
 * Tipos de Alert para o frontend.
 * Fonte: docs/backend/05-api-contracts.md (GET /api/alerts)
 * Fonte: src/contracts/entities/alert.ts
 */

export interface AlertDTO {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  relatedEntityId: string | null;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export type AlertFilter = 'all' | 'active' | 'resolved';
