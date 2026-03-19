import type { NodeStatus } from "../enums/node-status";
import type { NodeType } from "../enums/node-type";

/** Dispositivo ou servico que armazena chunks criptografados. */
export interface Node {
  id: string;
  clusterId: string;
  ownerId: string;
  type: NodeType;
  name: string;
  /** Espaco total em bytes */
  totalCapacity: number;
  /** Espaco usado em bytes */
  usedCapacity: number;
  status: NodeStatus;
  endpoint: string | null;
  /** Tier de armazenamento: hot (SSD), warm (S3), cold (Glacier) */
  tier: "hot" | "warm" | "cold";
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
}
