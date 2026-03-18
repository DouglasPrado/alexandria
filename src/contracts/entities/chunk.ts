/** Bloco criptografado de ~4MB. ID = SHA-256 (content-addressable). */
export interface Chunk {
  /** SHA-256 do conteudo criptografado */
  id: string;
  fileId: string;
  /** Posicao no arquivo (0-based) */
  chunkIndex: number;
  /** Tamanho em bytes */
  size: number;
  createdAt: string;
}

/** Tamanho alvo de cada chunk (~4MB) */
export const CHUNK_TARGET_SIZE = 4 * 1024 * 1024;

/** Fator minimo de replicacao */
export const REPLICATION_FACTOR = 3;
