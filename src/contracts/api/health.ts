/** GET /health/live */
export interface LivenessResponse {
  status: 'ok';
}

/** GET /health/ready */
export interface ReadinessResponse {
  status: 'ok' | 'degraded';
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    bullmq: 'up' | 'down';
  };
}

/** GET /health/metrics */
export interface MetricsResponse {
  nodes_online: number;
  nodes_suspect: number;
  files_total: number;
  storage_usage_percent: number;
  chunks_sub_replicated: number;
}

/** GET /api/storage/stats */
export interface StorageStatsResponse {
  totalChunks: number;
  uniqueChunks: number;
  duplicateChunks: number;
  spaceUsed: number;
  spaceSaved: number;
  dedupRatio: number;
}
