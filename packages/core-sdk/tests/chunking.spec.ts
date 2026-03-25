import { split, reassemble, DEFAULT_CHUNK_SIZE, type ChunkData } from '../src/chunking';
import { hash } from '../src/hashing';

/**
 * Testes do modulo de chunking — divisao em blocos ~4MB e reassembly.
 * Fonte: docs/blueprint/04-domain-model.md (RN-CH1, RN-CH2)
 * - RN-CH1: Tamanho fixo de ~4MB por chunk (ultimo chunk pode ser menor)
 * - RN-CH2: chunk_id = SHA-256(conteudo) — content-addressable
 */

describe('DEFAULT_CHUNK_SIZE', () => {
  it('should be 4MB (4 * 1024 * 1024 bytes)', () => {
    expect(DEFAULT_CHUNK_SIZE).toBe(4 * 1024 * 1024);
  });
});

describe('split()', () => {
  it('should split buffer into chunks of DEFAULT_CHUNK_SIZE', () => {
    // 10MB buffer → 2 full chunks (4MB) + 1 partial (2MB)
    const size = 10 * 1024 * 1024;
    const data = Buffer.alloc(size, 0xaa);
    const chunks = split(data);

    expect(chunks).toHaveLength(3);
    expect(chunks[0].data.length).toBe(DEFAULT_CHUNK_SIZE);
    expect(chunks[1].data.length).toBe(DEFAULT_CHUNK_SIZE);
    expect(chunks[2].data.length).toBe(2 * 1024 * 1024);
  });

  it('should assign sequential chunkIndex starting from 0', () => {
    const data = Buffer.alloc(10 * 1024 * 1024, 0xbb);
    const chunks = split(data);

    chunks.forEach((chunk, i) => {
      expect(chunk.chunkIndex).toBe(i);
    });
  });

  it('should calculate SHA-256 hash for each chunk (RN-CH2)', () => {
    const data = Buffer.alloc(10 * 1024 * 1024, 0xcc);
    const chunks = split(data);

    chunks.forEach((chunk) => {
      expect(chunk.hash).toMatch(/^[a-f0-9]{64}$/);
      // Hash must match content
      expect(chunk.hash).toBe(hash(chunk.data));
    });
  });

  it('should set correct size for each chunk', () => {
    const data = Buffer.alloc(10 * 1024 * 1024, 0xdd);
    const chunks = split(data);

    chunks.forEach((chunk) => {
      expect(chunk.size).toBe(chunk.data.length);
    });
  });

  it('should handle exact multiple of chunk size (no remainder)', () => {
    const data = Buffer.alloc(8 * 1024 * 1024, 0xee); // Exactly 2 chunks
    const chunks = split(data);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].data.length).toBe(DEFAULT_CHUNK_SIZE);
    expect(chunks[1].data.length).toBe(DEFAULT_CHUNK_SIZE);
  });

  it('should handle buffer smaller than chunk size (single chunk)', () => {
    const data = Buffer.alloc(1024, 0xff); // 1KB
    const chunks = split(data);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].data.length).toBe(1024);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it('should handle empty buffer', () => {
    const chunks = split(Buffer.alloc(0));
    expect(chunks).toHaveLength(0);
  });

  it('should handle 1-byte buffer', () => {
    const data = Buffer.from([42]);
    const chunks = split(data);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].data.length).toBe(1);
    expect(chunks[0].data[0]).toBe(42);
  });

  it('should accept custom chunk size', () => {
    const data = Buffer.alloc(100, 0xab);
    const chunks = split(data, 30);

    expect(chunks).toHaveLength(4); // 30 + 30 + 30 + 10
    expect(chunks[0].data.length).toBe(30);
    expect(chunks[1].data.length).toBe(30);
    expect(chunks[2].data.length).toBe(30);
    expect(chunks[3].data.length).toBe(10);
  });

  it('should produce unique hashes for different chunk content', () => {
    const data = Buffer.alloc(10 * 1024 * 1024);
    // Fill first half with 0xAA, second with 0xBB
    data.fill(0xaa, 0, 5 * 1024 * 1024);
    data.fill(0xbb, 5 * 1024 * 1024);

    const chunks = split(data);
    const hashes = chunks.map((c) => c.hash);
    const uniqueHashes = new Set(hashes);

    // Chunks with different content should have different hashes
    expect(uniqueHashes.size).toBe(hashes.length);
  });

  it('should produce identical hashes for chunks with identical content (content-addressable)', () => {
    // Two buffers with identical 4MB blocks
    const block = Buffer.alloc(DEFAULT_CHUNK_SIZE, 0xab);
    const data = Buffer.concat([block, block]);
    const chunks = split(data);

    expect(chunks).toHaveLength(2);
    // Same content → same hash (content-addressable, deduplication)
    expect(chunks[0].hash).toBe(chunks[1].hash);
  });

  it('should throw on invalid chunk size', () => {
    expect(() => split(Buffer.alloc(10), 0)).toThrow();
    expect(() => split(Buffer.alloc(10), -1)).toThrow();
  });
});

describe('reassemble()', () => {
  it('should reconstruct original buffer from chunks', () => {
    const original = Buffer.alloc(10 * 1024 * 1024);
    for (let i = 0; i < original.length; i++) {
      original[i] = i % 256;
    }

    const chunks = split(original);
    const reconstructed = reassemble(chunks);

    expect(reconstructed.equals(original)).toBe(true);
  });

  it('should handle single chunk', () => {
    const original = Buffer.from('small content');
    const chunks = split(original);
    const reconstructed = reassemble(chunks);

    expect(reconstructed.equals(original)).toBe(true);
  });

  it('should handle empty chunks array', () => {
    const result = reassemble([]);
    expect(result.length).toBe(0);
  });

  it('should reassemble in correct order regardless of input order', () => {
    const original = Buffer.alloc(100);
    for (let i = 0; i < 100; i++) original[i] = i;

    const chunks = split(original, 30);
    // Shuffle chunks
    const shuffled = [...chunks].reverse();
    const reconstructed = reassemble(shuffled);

    expect(reconstructed.equals(original)).toBe(true);
  });

  it('should be the inverse of split — round-trip integrity', () => {
    const sizes = [
      0,
      1,
      1023,
      1024,
      DEFAULT_CHUNK_SIZE - 1,
      DEFAULT_CHUNK_SIZE,
      DEFAULT_CHUNK_SIZE + 1,
      3 * DEFAULT_CHUNK_SIZE,
    ];

    for (const size of sizes) {
      const original = Buffer.alloc(size);
      for (let i = 0; i < size; i++) original[i] = i % 256;

      const reconstructed = reassemble(split(original));
      expect(reconstructed.equals(original)).toBe(true);
    }
  });
});
