/** Entrada de chunk dentro do manifest. */
export interface ManifestChunkEntry {
  chunkId: string;
  index: number;
  hash: string;
  size: number;
}

/** Mapa que descreve completamente um arquivo: chunks, hashes, chave de criptografia. */
export interface Manifest {
  id: string;
  fileId: string;
  chunks: ManifestChunkEntry[];
  /** IDs dos nos que possuem copia do manifest */
  replicatedTo: string[];
  createdAt: string;
  updatedAt: string;
}
