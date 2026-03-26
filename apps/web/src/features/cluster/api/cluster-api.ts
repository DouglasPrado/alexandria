/**
 * Cluster API — acesso a dados do cluster.
 * Fonte: docs/frontend/shared/06-data-layer.md
 *        docs/backend/05-api-contracts.md (GET /api/clusters/:id)
 */
import { apiClient } from '@/lib/api-client';
import type { ClusterStatsDTO } from '../types/cluster.types';

export const clusterApi = {
  /** GET /api/clusters/:id — estatísticas do cluster */
  stats: (id: string): Promise<ClusterStatsDTO> =>
    apiClient.get<ClusterStatsDTO>(`/clusters/${id}`),
};
