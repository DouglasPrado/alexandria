import type { NodeType } from '../enums/node-type';
import type { NodeStatus } from '../enums/node-status';
import type { NodeTier } from '../enums/node-tier';

/**
 * Node — Dispositivo fisico ou conta cloud que armazena chunks criptografados.
 * Heartbeat: 30min sem → suspect (RN-N1), 1h sem → lost + auto-healing (RN-N2).
 * Remocao exige drain obrigatorio (RN-N3).
 * Cluster precisa de minimo 3 nos ativos para aceitar uploads (RN-N6).
 */
export interface Node {
  id: string;
  clusterId: string;
  ownerId: string;
  type: NodeType;
  name: string;
  totalCapacity: bigint;
  usedCapacity: bigint;
  status: NodeStatus;
  endpoint: string;
  configEncrypted: Uint8Array;
  lastHeartbeat: Date | null;
  tier: NodeTier | null;
  createdAt: Date;
  updatedAt: Date;
}
