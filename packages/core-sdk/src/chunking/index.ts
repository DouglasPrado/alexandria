import { hash } from '../hashing';

/** Tamanho padrao de chunk: 4MB (RN-CH1) */
export const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024;

/**
 * Dados de um chunk apos split.
 * hash = SHA-256 do conteudo (content-addressable, RN-CH2).
 */
export interface ChunkData {
  /** SHA-256 do conteudo — funciona como chunk_id */
  hash: string;
  /** Posicao dentro do arquivo (para reassembly) */
  chunkIndex: number;
  /** Tamanho em bytes */
  size: number;
  /** Conteudo do chunk */
  data: Buffer;
}

/**
 * Divide um buffer em chunks de tamanho fixo (~4MB).
 * Ultimo chunk pode ser menor que chunkSize (RN-CH1).
 * Cada chunk recebe SHA-256 hash para content-addressable storage (RN-CH2).
 *
 * @param content - Buffer a ser dividido
 * @param chunkSize - Tamanho de cada chunk em bytes (default: 4MB)
 * @returns Array de ChunkData ordenado por chunkIndex
 */
export function split(content: Buffer, chunkSize: number = DEFAULT_CHUNK_SIZE): ChunkData[] {
  if (chunkSize <= 0) {
    throw new Error(`Invalid chunk size: ${chunkSize}. Must be a positive integer.`);
  }

  if (content.length === 0) {
    return [];
  }

  const chunks: ChunkData[] = [];
  let offset = 0;
  let index = 0;

  while (offset < content.length) {
    const end = Math.min(offset + chunkSize, content.length);
    const data = content.subarray(offset, end);

    chunks.push({
      hash: hash(Buffer.from(data)),
      chunkIndex: index,
      size: data.length,
      data: Buffer.from(data),
    });

    offset = end;
    index++;
  }

  return chunks;
}

/**
 * Reassembla chunks em um buffer unico.
 * Ordena por chunkIndex antes de concatenar (RN-CH1).
 *
 * @param chunks - Array de ChunkData (qualquer ordem)
 * @returns Buffer reconstituido
 */
export function reassemble(chunks: ChunkData[]): Buffer {
  if (chunks.length === 0) {
    return Buffer.alloc(0);
  }

  const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
  return Buffer.concat(sorted.map((c) => c.data));
}
