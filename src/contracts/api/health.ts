import type { Alert } from "../entities/alert";

export interface ClusterHealthResponse {
  totalNodes: number;
  onlineNodes: number;
  totalFiles: number;
  totalChunks: number;
  replicationCoverage: number;
  totalCapacityBytes: number;
  usedCapacityBytes: number;
  activeAlerts: Alert[];
}
