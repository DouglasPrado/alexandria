/**
 * Manifest — Mapa de reconstituicao de um arquivo.
 * Contem lista ordenada de chunk_ids + file key criptografada + assinatura (RN-MA2).
 * Fonte de verdade para reassembly e recovery via seed (RN-MA5).
 * Todo arquivo ready tem exatamente 1 manifest (RN-MA1).
 * Replicado em 2+ nos alem do PostgreSQL (RN-MA4).
 */
export interface Manifest {
  id: string;
  fileId: string;
  chunksJson: ManifestChunkEntry[];
  fileKeyEncrypted: Uint8Array;
  signature: Uint8Array;
  replicatedTo: string[];
  version: number;
  codingScheme: string;
  dataShards: number;
  parityShards: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManifestChunkEntry {
  chunkId: string;
  chunkIndex: number;
  size: number;
}
