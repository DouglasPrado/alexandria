import { hash, hashStream } from '../src/hashing';
import { createReadStream } from 'fs';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync } from 'fs';

/**
 * Testes do modulo de hashing — SHA-256 content-addressable.
 * Fonte: docs/blueprint/04-domain-model.md (RN-CH2)
 * chunk_id = SHA-256(conteudo) — imutavel, content-addressable.
 */

const FIXTURES_DIR = join(__dirname, '__fixtures__');

beforeAll(() => {
  mkdirSync(FIXTURES_DIR, { recursive: true });
});

afterAll(() => {
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

describe('hash()', () => {
  it('should return a 64-char lowercase hex string (SHA-256)', () => {
    const result = hash(Buffer.from('hello world'));
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should be deterministic — same input produces same hash', () => {
    const data = Buffer.from('deterministic test data');
    expect(hash(data)).toBe(hash(data));
  });

  it('should produce different hashes for different inputs', () => {
    const a = hash(Buffer.from('input A'));
    const b = hash(Buffer.from('input B'));
    expect(a).not.toBe(b);
  });

  it('should match known SHA-256 vector for empty buffer', () => {
    // SHA-256 of empty string
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    expect(hash(Buffer.alloc(0))).toBe(expected);
  });

  it('should match known SHA-256 vector for "abc"', () => {
    const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    expect(hash(Buffer.from('abc'))).toBe(expected);
  });

  it('should handle large buffers (16MB)', () => {
    const large = Buffer.alloc(16 * 1024 * 1024, 0xab);
    const result = hash(large);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
    // Deterministic
    expect(hash(large)).toBe(result);
  });
});

describe('hashStream()', () => {
  it('should produce same hash as hash() for a file', async () => {
    const content = Buffer.from('stream hashing test content');
    const filePath = join(FIXTURES_DIR, 'stream-test.bin');
    writeFileSync(filePath, content);

    const streamHash = await hashStream(createReadStream(filePath));
    const bufferHash = hash(content);

    expect(streamHash).toBe(bufferHash);
  });

  it('should handle empty file', async () => {
    const filePath = join(FIXTURES_DIR, 'empty.bin');
    writeFileSync(filePath, Buffer.alloc(0));

    const result = await hashStream(createReadStream(filePath));
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    expect(result).toBe(expected);
  });
});
