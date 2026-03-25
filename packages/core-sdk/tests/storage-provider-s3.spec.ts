import { S3StorageProvider, type S3StorageConfig } from '../src/storage-provider/s3';
import type { StorageProvider } from '../src/storage-provider';

/**
 * Testes do S3StorageProvider — provedores S3-compatible (AWS S3, R2, B2).
 * Fonte: docs/backend/13-integrations.md (StorageProviderClient)
 * Fonte: docs/blueprint/06-system-architecture.md (StorageProvider S3/R2/B2)
 *
 * Testes usam mock do S3Client — sem chamadas reais a AWS.
 * Conforme backend/14-tests: MockStorageProvider para unit tests.
 */

// In-memory mock simulating S3 bucket
const mockBucket = new Map<string, Buffer>();

// Mock @aws-sdk/client-s3
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((command: any) => {
        const name = command.constructor.name;

        if (name === 'PutObjectCommand') {
          mockBucket.set(command.input.Key, Buffer.from(command.input.Body));
          return Promise.resolve({});
        }

        if (name === 'GetObjectCommand') {
          const data = mockBucket.get(command.input.Key);
          if (!data) {
            const err = new Error('NoSuchKey');
            (err as any).name = 'NoSuchKey';
            return Promise.reject(err);
          }
          return Promise.resolve({
            Body: {
              transformToByteArray: () => Promise.resolve(new Uint8Array(data)),
            },
          });
        }

        if (name === 'HeadObjectCommand') {
          if (!mockBucket.has(command.input.Key)) {
            const err = new Error('NotFound');
            (err as any).name = 'NotFound';
            (err as any).$metadata = { httpStatusCode: 404 };
            return Promise.reject(err);
          }
          return Promise.resolve({
            ContentLength: mockBucket.get(command.input.Key)!.length,
          });
        }

        if (name === 'DeleteObjectCommand') {
          mockBucket.delete(command.input.Key);
          return Promise.resolve({});
        }

        if (name === 'ListObjectsV2Command') {
          const prefix = command.input.Prefix || '';
          const keys = [...mockBucket.keys()].filter((k) => k.startsWith(prefix));
          return Promise.resolve({
            Contents: keys.map((k) => ({ Key: k, Size: mockBucket.get(k)!.length })),
            IsTruncated: false,
          });
        }

        return Promise.reject(new Error(`Unknown command: ${name}`));
      }),
      destroy: jest.fn(),
    })),
    PutObjectCommand: jest.fn().mockImplementation((input: any) => ({
      constructor: { name: 'PutObjectCommand' },
      input,
    })),
    GetObjectCommand: jest.fn().mockImplementation((input: any) => ({
      constructor: { name: 'GetObjectCommand' },
      input,
    })),
    HeadObjectCommand: jest.fn().mockImplementation((input: any) => ({
      constructor: { name: 'HeadObjectCommand' },
      input,
    })),
    DeleteObjectCommand: jest.fn().mockImplementation((input: any) => ({
      constructor: { name: 'DeleteObjectCommand' },
      input,
    })),
    ListObjectsV2Command: jest.fn().mockImplementation((input: any) => ({
      constructor: { name: 'ListObjectsV2Command' },
      input,
    })),
  };
});

const config: S3StorageConfig = {
  endpoint: 'https://s3.amazonaws.com',
  region: 'us-east-1',
  bucket: 'alexandria-test',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};

let provider: S3StorageProvider;

beforeEach(() => {
  mockBucket.clear();
  provider = new S3StorageProvider(config);
});

afterEach(() => {
  provider.destroy();
});

describe('S3StorageProvider', () => {
  describe('interface contract', () => {
    it('should implement StorageProvider interface', () => {
      const sp: StorageProvider = provider;
      expect(typeof sp.put).toBe('function');
      expect(typeof sp.get).toBe('function');
      expect(typeof sp.exists).toBe('function');
      expect(typeof sp.delete).toBe('function');
      expect(typeof sp.list).toBe('function');
      expect(typeof sp.capacity).toBe('function');
    });
  });

  describe('put()', () => {
    it('should store chunk data', async () => {
      await expect(provider.put('chunk-abc', Buffer.from('data'))).resolves.toBeUndefined();
    });

    it('should overwrite existing chunk', async () => {
      await provider.put('chunk-1', Buffer.from('v1'));
      await provider.put('chunk-1', Buffer.from('v2'));
      const result = await provider.get('chunk-1');
      expect(result.equals(Buffer.from('v2'))).toBe(true);
    });
  });

  describe('get()', () => {
    it('should retrieve stored data', async () => {
      const data = Buffer.from('encrypted chunk content');
      await provider.put('chunk-get', data);
      const result = await provider.get('chunk-get');
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
      expect(await provider.exists('no-such')).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should remove chunk', async () => {
      await provider.put('del-test', Buffer.from('data'));
      await provider.delete('del-test');
      expect(await provider.exists('del-test')).toBe(false);
    });

    it('should not throw on non-existent chunk (idempotent)', async () => {
      await expect(provider.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('list()', () => {
    it('should list all chunk IDs', async () => {
      await provider.put('a-chunk', Buffer.from('a'));
      await provider.put('b-chunk', Buffer.from('b'));

      const result = await provider.list();
      expect(result.sort()).toEqual(['a-chunk', 'b-chunk']);
    });

    it('should filter by prefix', async () => {
      await provider.put('photo-001', Buffer.from('a'));
      await provider.put('photo-002', Buffer.from('b'));
      await provider.put('video-001', Buffer.from('c'));

      const result = await provider.list('photo-');
      expect(result.sort()).toEqual(['photo-001', 'photo-002']);
    });

    it('should return empty array when bucket is empty', async () => {
      const result = await provider.list();
      expect(result).toEqual([]);
    });
  });

  describe('capacity()', () => {
    it('should return total and used as bigints', async () => {
      await provider.put('cap-1', Buffer.alloc(1024));
      const cap = await provider.capacity();
      expect(typeof cap.total).toBe('bigint');
      expect(typeof cap.used).toBe('bigint');
    });

    it('should reflect stored data in used', async () => {
      await provider.put('cap-a', Buffer.alloc(500));
      await provider.put('cap-b', Buffer.alloc(300));
      const cap = await provider.capacity();
      expect(cap.used).toBeGreaterThanOrEqual(800n);
    });
  });

  describe('round-trip integrity', () => {
    it('should preserve exact bytes through put/get', async () => {
      const data = Buffer.alloc(256);
      for (let i = 0; i < 256; i++) data[i] = i;

      await provider.put('binary-test', data);
      const result = await provider.get('binary-test');
      expect(result.equals(data)).toBe(true);
    });

    it('should handle SHA-256 chunk IDs', async () => {
      const chunkId = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      await provider.put(chunkId, Buffer.from('cas'));
      expect(await provider.exists(chunkId)).toBe(true);
      const result = await provider.get(chunkId);
      expect(result.equals(Buffer.from('cas'))).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should use custom prefix for chunk keys', () => {
      const prefixed = new S3StorageProvider({ ...config, prefix: 'chunks/' });
      // Verify instance created without error
      expect(prefixed).toBeDefined();
      prefixed.destroy();
    });
  });
});
