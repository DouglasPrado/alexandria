import type { NodeType } from '../enums/node-type';
import type { NodeStatus } from '../enums/node-status';

/** POST /api/nodes */
export interface RegisterNodeRequest {
  name: string;
  type: NodeType;
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
}

export interface NodeResponse {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  totalCapacity: number;
  usedCapacity: number;
  chunksStored: number;
  lastHeartbeat: string | null;
  createdAt: string;
}

/** POST /api/nodes/:id/drain */
export interface DrainNodeResponse {
  id: string;
  status: NodeStatus;
  chunksToMigrate: number;
  estimatedTime: string;
}
