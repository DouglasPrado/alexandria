/**
 * Alerts API — camada de acesso a dados para alertas de saude.
 * Fonte: docs/backend/05-api-contracts.md (GET /api/alerts, PATCH /api/alerts/:id/resolve)
 */
import { apiClient } from '@/lib/api-client';
import type { AlertDTO } from '../types/alert.types';

export const alertsApi = {
  /** GET /api/alerts — listagem com filtro opcional por resolved */
  list: (resolved?: boolean): Promise<AlertDTO[]> => {
    const params: Record<string, string> = {};
    if (resolved !== undefined) params.resolved = String(resolved);
    return apiClient.get<AlertDTO[]>('/alerts', params);
  },

  /** PATCH /api/alerts/:id/resolve — resolver alerta */
  resolve: (id: string): Promise<{ id: string; resolved: boolean; resolvedAt: string }> =>
    apiClient.patch(`/alerts/${id}/resolve`),
};
