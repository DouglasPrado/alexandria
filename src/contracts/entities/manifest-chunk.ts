/**
 * ManifestChunk — Tabela de juncao entre manifests e chunks.
 * Permite deduplicacao cross-file: um chunk referenciado por multiplos manifests.
 */
export interface ManifestChunk {
  id: string;
  manifestId: string;
  chunkId: string;
  chunkIndex: number;
}
