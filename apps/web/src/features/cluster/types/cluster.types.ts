/**
 * Tipos do cluster — derivados de docs/backend/05-api-contracts.md (GET /api/clusters/:id)
 */

export interface ClusterStatsDTO {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  totalNodes: number;
  totalFiles: number;
  totalStorage: number;
  usedStorage: number;
  replicationFactor: number;
  createdAt: string;
}
