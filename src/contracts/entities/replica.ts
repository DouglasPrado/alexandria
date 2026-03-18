/** Registro de que um chunk esta armazenado em um no especifico. */
export interface ChunkReplica {
  id: string;
  chunkId: string;
  nodeId: string;
  verifiedAt: string | null;
  createdAt: string;
}
