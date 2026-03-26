import { join } from 'node:path';
import { readFile, writeFile, unlink, readdir, access, mkdir } from 'node:fs/promises';

/**
 * LocalChunkStorage — armazenamento de chunks no filesystem local.
 * Fonte: docs/blueprint/06-system-architecture.md (Agente de No — armazena chunks)
 *
 * Cada chunk e um arquivo cujo nome e o chunkId (SHA-256 hex).
 * Operacoes: put, get, delete, exists, list.
 */
export class LocalChunkStorage {
  constructor(private readonly basePath: string) {}

  /** Garante que o diretorio base existe */
  async ensureDir(): Promise<void> {
    await mkdir(this.basePath, { recursive: true });
  }

  /** Grava chunk no filesystem */
  async put(chunkId: string, data: Buffer): Promise<void> {
    await this.ensureDir();
    await writeFile(join(this.basePath, chunkId), data);
  }

  /** Le chunk do filesystem */
  async get(chunkId: string): Promise<Buffer> {
    return readFile(join(this.basePath, chunkId));
  }

  /** Remove chunk do filesystem. Idempotente. */
  async delete(chunkId: string): Promise<void> {
    try {
      await unlink(join(this.basePath, chunkId));
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  /** Verifica se chunk existe */
  async exists(chunkId: string): Promise<boolean> {
    try {
      await access(join(this.basePath, chunkId));
      return true;
    } catch {
      return false;
    }
  }

  /** Lista todos os chunkIds armazenados */
  async list(): Promise<string[]> {
    try {
      return await readdir(this.basePath);
    } catch {
      return [];
    }
  }
}
