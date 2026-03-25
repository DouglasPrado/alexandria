import { readFile, writeFile, unlink, readdir, stat, mkdir } from 'node:fs/promises';
import { statfsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Interface unificada para armazenamento de chunks criptografados.
 * Operacoes: put/get/exists/delete/list/capacity.
 *
 * Principio: Interfaces sobre Implementacoes (blueprint/02-architecture_principles.md)
 * Trocar S3 por R2 ou adicionar B2 nao afeta logica de replicacao ou distribuicao.
 *
 * Implementacoes: LocalStorageProvider (filesystem), S3StorageProvider (aws-sdk-s3)
 */
export interface StorageProvider {
  /** Armazena chunk criptografado */
  put(chunkId: string, data: Buffer): Promise<void>;
  /** Recupera chunk criptografado */
  get(chunkId: string): Promise<Buffer>;
  /** Verifica se chunk existe */
  exists(chunkId: string): Promise<boolean>;
  /** Remove chunk */
  delete(chunkId: string): Promise<void>;
  /** Lista chunk IDs, opcionalmente filtrados por prefixo */
  list(prefix?: string): Promise<string[]>;
  /** Espaco total e usado em bytes */
  capacity(): Promise<{ total: bigint; used: bigint }>;
}

/**
 * StorageProvider para filesystem local.
 * Usado por agentes de no (PC, NAS, VPS) e em desenvolvimento.
 * Chunks armazenados como arquivos individuais em um diretorio configuravel.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;
  private initialized = false;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private async ensureDir(): Promise<void> {
    if (!this.initialized) {
      await mkdir(this.baseDir, { recursive: true });
      this.initialized = true;
    }
  }

  private chunkPath(chunkId: string): string {
    return join(this.baseDir, chunkId);
  }

  async put(chunkId: string, data: Buffer): Promise<void> {
    await this.ensureDir();
    await writeFile(this.chunkPath(chunkId), data);
  }

  async get(chunkId: string): Promise<Buffer> {
    try {
      return await readFile(this.chunkPath(chunkId));
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new Error(`Chunk "${chunkId}" not found.`);
      }
      throw err;
    }
  }

  async exists(chunkId: string): Promise<boolean> {
    try {
      await stat(this.chunkPath(chunkId));
      return true;
    } catch {
      return false;
    }
  }

  async delete(chunkId: string): Promise<void> {
    try {
      await unlink(this.chunkPath(chunkId));
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return; // idempotent
      throw err;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    await this.ensureDir();
    try {
      const entries = await readdir(this.baseDir);
      if (prefix) {
        return entries.filter((name) => name.startsWith(prefix));
      }
      return entries;
    } catch {
      return [];
    }
  }

  async capacity(): Promise<{ total: bigint; used: bigint }> {
    await this.ensureDir();

    // Use statfs for filesystem-level capacity
    const stats = statfsSync(this.baseDir);
    const blockSize = BigInt(stats.bsize);
    const total = BigInt(stats.blocks) * blockSize;
    const free = BigInt(stats.bfree) * blockSize;
    const used = total - free;

    return { total, used };
  }
}
