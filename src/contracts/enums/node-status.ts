/**
 * Status do ciclo de vida de um no.
 * Transicoes: online → suspect (30min sem heartbeat) → lost (1h) → auto-healing
 * Drain: online → draining → disconnected
 */
export enum NodeStatus {
  ONLINE = 'online',
  SUSPECT = 'suspect',
  LOST = 'lost',
  DRAINING = 'draining',
  DISCONNECTED = 'disconnected',
}
