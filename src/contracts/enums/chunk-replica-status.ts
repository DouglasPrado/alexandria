/** Status de integridade de uma replica de chunk */
export enum ChunkReplicaStatus {
  HEALTHY = 'healthy',
  CORRUPTED = 'corrupted',
  PENDING = 'pending',
}
