import { createHash, type Hash } from 'node:crypto';
import type { Readable } from 'node:stream';

/**
 * Calcula SHA-256 de um buffer e retorna como hex string (64 chars).
 * Usado para content-addressable storage: chunk_id = SHA-256(conteudo) (RN-CH2).
 */
export function hash(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Calcula SHA-256 de um Readable stream.
 * Util para arquivos grandes que nao cabem em memoria.
 */
export function hashStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hasher: Hash = createHash('sha256');
    stream.on('data', (chunk: Buffer) => hasher.update(chunk));
    stream.on('end', () => resolve(hasher.digest('hex')));
    stream.on('error', reject);
  });
}
