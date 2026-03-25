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
