import type { Cluster } from "../entities/cluster";

/** Request para criacao de cluster. */
export interface CreateClusterRequest {
  name: string;
}

/** Response da criacao com seed phrase (exibida uma unica vez). */
export interface CreateClusterResponse {
  cluster: Cluster;
  seedPhrase: string[];
}

/** Response da listagem de clusters (o membro so participa de 1). */
export interface GetClusterResponse {
  cluster: Cluster;
}
