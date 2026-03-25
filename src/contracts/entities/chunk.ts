/**
 * Chunk — Bloco de ~4MB de dados criptografados com AES-256-GCM.
 * Enderecado por SHA-256 do conteudo (content-addressable, RN-CH2).
 * Pode ser referenciado por multiplos manifests (deduplicacao cross-file, RN-CH4).
 * Sem referencia → orfao → elegivel para GC (RN-CH5).
 */
export interface Chunk {
  /** SHA-256 do conteudo criptografado — PK content-addressable */
  id: string;
  size: number;
  referenceCount: number;
  createdAt: Date;
}
