/**
 * Tipos de dados de nós — derivados de src/contracts/api/nodes.ts
 * Fonte: docs/frontend/web/04-components.md (Feature: nodes)
 */

export type NodeStatus = 'online' | 'suspect' | 'lost' | 'draining' | 'disconnected';
export type NodeType = 'local' | 's3' | 'r2' | 'b2' | 'vps';

export interface NodeDTO {
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

export interface RegisterNodeRequest {
  name: string;
  type: NodeType;
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
}

export interface DrainNodeResponse {
  id: string;
  status: NodeStatus;
  chunksToMigrate: number;
  estimatedTime: string;
}

export interface NodesResponse {
  data: NodeDTO[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
  };
}
