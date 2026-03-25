import { mkdtempSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { LocalStorageProvider } from '../src/storage-provider';
import type { StorageProvider } from '../src/storage-provider';

/**
 * Testes do StorageProvider — interface unificada + implementacao local.
 * Fonte: docs/shared/glossary.md (StorageProvider: put/get/exists/delete/list/capacity)
 * Fonte: docs/backend/13-integrations.md (StorageProviderClient)
 * Fonte: docs/blueprint/02-architecture_principles.md (Interfaces sobre Implementacoes)
 *
 * LocalStorageProvider: filesystem local para agentes de no e dev.
 */

let tempDir: string;
let provider: StorageProvider;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'alexandria-test-'));
  provider = new LocalStorageProvider(tempDir);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('LocalStorageProvider', () => {
  describe('put()', () => {
    it('should store a chunk without error', async () => {
      const data = Buffer.from('chunk content');
      await expect(provider.put('chunk-abc123', data)).resolves.toBeUndefined();
    });

    it('should overwrite existing chunk', async () => {
      await provider.put('chunk-1', Buffer.from('original'));
      await provider.put('chunk-1', Buffer.from('updated'));

      const result = await provider.get('chunk-1');
      expect(result.equals(Buffer.from('updated'))).toBe(true);
    });

    it('should handle empty data', async () => {
      await provider.put('empty-chunk', Buffer.alloc(0));
      const result = await provider.get('empty-chunk');
      expect(result.length).toBe(0);
    });

    it('should handle large data (4MB chunk)', async () => {
      const data = Buffer.alloc(4 * 1024 * 1024, 0xab);
      await provider.put('large-chunk', data);
      const result = await provider.get('large-chunk');
      expect(result.equals(data)).toBe(true);
    });
  });

  describe('get()', () => {
    it('should retrieve stored chunk data', async () => {
      const data = Buffer.from('family photo chunk data');
      await provider.put('photo-chunk', data);

      const result = await provider.get('photo-chunk');
      expect(result.equals(data)).toBe(true);
    });

    it('should throw on non-existent chunk', async () => {
      await expect(provider.get('non-existent')).rejects.toThrow();
    });
  });

  describe('exists()', () => {
    it('should return true for existing chunk', async () => {
      await provider.put('exists-test', Buffer.from('data'));
      expect(await provider.exists('exists-test')).toBe(true);
    });

    it('should return false for non-existent chunk', async () => {
      expect(await provider.exists('no-such-chunk')).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should remove an existing chunk', async () => {
      await provider.put('to-delete', Buffer.from('data'));
      await provider.delete('to-delete');
      expect(await provider.exists('to-delete')).toBe(false);
    });

    it('should not throw when deleting non-existent chunk', async () => {
      await expect(provider.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('list()', () => {
    it('should return empty array when no chunks stored', async () => {
      const result = await provider.list();
      expect(result).toEqual([]);
    });

    it('should list all stored chunk IDs', async () => {
      await provider.put('chunk-a', Buffer.from('a'));
      await provider.put('chunk-b', Buffer.from('b'));
      await provider.put('chunk-c', Buffer.from('c'));

      const result = await provider.list();
      expect(result.sort()).toEqual(['chunk-a', 'chunk-b', 'chunk-c']);
    });

    it('should filter by prefix', async () => {
      await provider.put('photo-001', Buffer.from('a'));
      await provider.put('photo-002', Buffer.from('b'));
      await provider.put('video-001', Buffer.from('c'));

      const result = await provider.list('photo-');
      expect(result.sort()).toEqual(['photo-001', 'photo-002']);
    });

    it('should not list deleted chunks', async () => {
      await provider.put('keep', Buffer.from('a'));
      await provider.put('remove', Buffer.from('b'));
      await provider.delete('remove');

      const result = await provider.list();
      expect(result).toEqual(['keep']);
    });
  });

  describe('capacity()', () => {
    it('should return total and used as bigints', async () => {
      const cap = await provider.capacity();
      expect(typeof cap.total).toBe('bigint');
      expect(typeof cap.used).toBe('bigint');
    });

    it('should report total > 0', async () => {
      const cap = await provider.capacity();
      expect(cap.total).toBeGreaterThan(0n);
    });

    it('should increase used after storing data', async () => {
      const before = await provider.capacity();
      await provider.put('cap-test', Buffer.alloc(1024, 0xff));
      const after = await provider.capacity();
      expect(after.used).toBeGreaterThanOrEqual(before.used);
    });
  });

  describe('interface contract', () => {
    it('should implement all StorageProvider methods', () => {
      // Type-level check: provider satisfies StorageProvider interface
      const sp: StorageProvider = provider;
      expect(typeof sp.put).toBe('function');
      expect(typeof sp.get).toBe('function');
      expect(typeof sp.exists).toBe('function');
      expect(typeof sp.delete).toBe('function');
      expect(typeof sp.list).toBe('function');
      expect(typeof sp.capacity).toBe('function');
    });
  });

  describe('round-trip integrity', () => {
    it('should preserve exact bytes through put/get cycle', async () => {
      // Binary data with all byte values
      const data = Buffer.alloc(256);
      for (let i = 0; i < 256; i++) data[i] = i;

      await provider.put('binary-test', data);
      const result = await provider.get('binary-test');
      expect(result.equals(data)).toBe(true);
    });

    it('should handle chunk IDs with SHA-256 format', async () => {
      const chunkId = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const data = Buffer.from('content-addressable chunk');

      await provider.put(chunkId, data);
      expect(await provider.exists(chunkId)).toBe(true);

      const result = await provider.get(chunkId);
      expect(result.equals(data)).toBe(true);
    });
  });
});
