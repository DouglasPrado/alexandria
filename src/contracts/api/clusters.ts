import type { ClusterStatus } from '../enums/cluster-status';

/** POST /api/clusters */
export interface CreateClusterRequest {
  name: string;
  admin: {
    name: string;
    email: string;
    password: string;
  };
}

export interface CreateClusterResponse {
  cluster: ClusterResponse;
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  /** Exibida UMA UNICA VEZ — nao armazenada no banco */
  seedPhrase: string;
}

/** GET /api/clusters/:id */
export interface ClusterResponse {
  id: string;
  name: string;
  status: ClusterStatus;
  totalNodes: number;
  totalFiles: number;
  totalStorage: number;
  usedStorage: number;
  replicationFactor: number;
  createdAt: string;
}

/** POST /api/clusters/:id/recovery */
export interface RecoverClusterRequest {
  seedPhrase: string;
}

export interface RecoverClusterResponse {
  status: string;
  recoveredVaults: number;
  recoveredManifests: number;
  nodesReconnected: number;
  nodesOffline: number;
  integrityCheck: {
    totalChunks: number;
    healthyChunks: number;
    pendingHealing: number;
  };
}
