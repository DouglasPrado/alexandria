/** Tipos de alerta gerados automaticamente pelo Scheduler */
export enum AlertType {
  NODE_OFFLINE = 'node_offline',
  REPLICATION_LOW = 'replication_low',
  TOKEN_EXPIRED = 'token_expired',
  SPACE_LOW = 'space_low',
  CORRUPTION_DETECTED = 'corruption_detected',
  AUTO_HEALING_COMPLETE = 'auto_healing_complete',
}
