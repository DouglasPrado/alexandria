import { resolve, join } from 'node:path';
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { LocalChunkStorage } from '../src/storage';

/**
 * Testes do LocalChunkStorage — armazenamento local de chunks no filesystem.
 * Fonte: docs/blueprint/06-system-architecture.md (Agente de No — armazena chunks)
 *
 * - put(chunkId, data): grava chunk no filesystem
 * - get(chunkId): le chunk do filesystem
 * - delete(chunkId): remove chunk do filesystem
 * - exists(chunkId): verifica se chunk existe
 * - list(): lista todos os chunks armazenados
 */

const TEST_DIR = resolve(__dirname, '__fixtures__', 'chunks');

describe('LocalChunkStorage', () => {
  let storage: LocalChunkStorage;

  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    storage = new LocalChunkStorage(TEST_DIR);
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('put()', () => {
    it('should write chunk data to filesystem', async () => {
      const data = Buffer.from('encrypted-chunk-data');
      await storage.put('chunk-aaa', data);

      const filePath = join(TEST_DIR, 'chunk-aaa');
      expect(existsSync(filePath)).toBe(true);
      expect(readFileSync(filePath).equals(data)).toBe(true);
    });
  });

  describe('get()', () => {
    it('should read chunk data from filesystem', async () => {
      const data = Buffer.from('my-chunk-content');
      writeFileSync(join(TEST_DIR, 'chunk-bbb'), data);

      const result = await storage.get('chunk-bbb');
      expect(result.equals(data)).toBe(true);
    });

    it('should throw if chunk does not exist', async () => {
      await expect(storage.get('non-existent')).rejects.toThrow();
    });
  });

  describe('delete()', () => {
    it('should remove chunk from filesystem', async () => {
      writeFileSync(join(TEST_DIR, 'chunk-ccc'), Buffer.from('data'));

      await storage.delete('chunk-ccc');

      expect(existsSync(join(TEST_DIR, 'chunk-ccc'))).toBe(false);
    });

    it('should not throw if chunk does not exist (idempotent)', async () => {
      await expect(storage.delete('ghost')).resolves.not.toThrow();
    });
  });

  describe('exists()', () => {
    it('should return true for existing chunk', async () => {
      writeFileSync(join(TEST_DIR, 'chunk-ddd'), Buffer.from('data'));

      expect(await storage.exists('chunk-ddd')).toBe(true);
    });

    it('should return false for missing chunk', async () => {
      expect(await storage.exists('missing')).toBe(false);
    });
  });

  describe('list()', () => {
    it('should return all chunk ids stored', async () => {
      writeFileSync(join(TEST_DIR, 'chunk-1'), Buffer.from('a'));
      writeFileSync(join(TEST_DIR, 'chunk-2'), Buffer.from('b'));

      const ids = await storage.list();
      expect(ids.sort()).toEqual(['chunk-1', 'chunk-2']);
    });

    it('should return empty array when no chunks', async () => {
      const ids = await storage.list();
      expect(ids).toEqual([]);
    });
  });
});
