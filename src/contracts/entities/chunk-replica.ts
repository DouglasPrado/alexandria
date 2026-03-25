import type { ChunkReplicaStatus } from '../enums/chunk-replica-status';

/**
 * ChunkReplica — Copia de um chunk armazenada em um no especifico.
 * Minimo 3 replicas por chunk em nos diferentes (RN-CR1).
 * Scrubbing periodico recalcula SHA-256 e compara com chunk_id (RN-CR3).
 * Replica corrompida substituida automaticamente (RN-CR4).
 */
export interface ChunkReplica {
  id: string;
  chunkId: string;
  nodeId: string;
  status: ChunkReplicaStatus;
  verifiedAt: Date | null;
  createdAt: Date;
}
