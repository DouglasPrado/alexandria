import { encodeErasure, decodeErasure } from '../src/erasure';

/**
 * Testes do módulo de erasure coding — Reed-Solomon RS(n,k) em GF(2^8).
 * Fonte: docs/blueprint/11-build_plan.md (Fase 3 — Erasure coding 10+4)
 *
 * - EC-1: encode → decode round-trip com todos os shards
 * - EC-2: decode com shards ausentes dentro da tolerância (≤ parityShards)
 * - EC-3: decode falha quando ausentes > parityShards
 * - EC-4: encode produz dataShards + parityShards shards do mesmo tamanho
 * - EC-5: encode é determinístico (mesmos dados → mesmos shards)
 * - EC-6: decode com shards em posições não contíguas (qualquer subconjunto)
 */

const DATA_SHARDS = 10;
const PARITY_SHARDS = 4;

function makeData(size: number): Buffer {
  const buf = Buffer.alloc(size);
  for (let i = 0; i < size; i++) buf[i] = i % 251; // prime modulo for variation
  return buf;
}

describe('encodeErasure()', () => {
  it('should produce dataShards + parityShards buffers of equal size (EC-4)', () => {
    const data = makeData(1000);
    const shards = encodeErasure(data, DATA_SHARDS, PARITY_SHARDS);

    expect(shards).toHaveLength(DATA_SHARDS + PARITY_SHARDS);
    const shardSize = shards[0]!.length;
    for (const shard of shards) {
      expect(shard.length).toBe(shardSize);
    }
  });

  it('should be deterministic — same data produces same shards (EC-5)', () => {
    const data = makeData(512);
    const shards1 = encodeErasure(data, DATA_SHARDS, PARITY_SHARDS);
    const shards2 = encodeErasure(data, DATA_SHARDS, PARITY_SHARDS);

    for (let i = 0; i < shards1.length; i++) {
      expect(shards1[i]!.equals(shards2[i]!)).toBe(true);
    }
  });

  it('should work with small data (less than dataShards bytes)', () => {
    const data = makeData(5); // smaller than DATA_SHARDS
    const shards = encodeErasure(data, DATA_SHARDS, PARITY_SHARDS);
    expect(shards).toHaveLength(DATA_SHARDS + PARITY_SHARDS);
  });
});

describe('decodeErasure()', () => {
  it('should reconstruct original data with all shards present (EC-1)', () => {
    const original = makeData(1000);
    const shards = encodeErasure(original, DATA_SHARDS, PARITY_SHARDS);

    const result = decodeErasure(shards.map(s => s), DATA_SHARDS, PARITY_SHARDS, original.length);

    expect(result.equals(original)).toBe(true);
  });

  it('should reconstruct with up to parityShards missing (EC-2)', () => {
    const original = makeData(4096);
    const shards = encodeErasure(original, DATA_SHARDS, PARITY_SHARDS);

    // Remove 4 shards (indices 3, 7, 10, 13)
    const sparse: (Buffer | null)[] = [...shards];
    sparse[3] = null;
    sparse[7] = null;
    sparse[10] = null;
    sparse[13] = null;

    const result = decodeErasure(sparse, DATA_SHARDS, PARITY_SHARDS, original.length);

    expect(result.equals(original)).toBe(true);
  });

  it('should reconstruct when only data shards are missing (EC-6)', () => {
    const original = makeData(2048);
    const shards = encodeErasure(original, DATA_SHARDS, PARITY_SHARDS);

    // Remove first 4 data shards — reconstruct from remaining 6 data + 4 parity
    const sparse: (Buffer | null)[] = [...shards];
    sparse[0] = null;
    sparse[1] = null;
    sparse[2] = null;
    sparse[3] = null;

    const result = decodeErasure(sparse, DATA_SHARDS, PARITY_SHARDS, original.length);

    expect(result.equals(original)).toBe(true);
  });

  it('should throw when more than parityShards are missing (EC-3)', () => {
    const original = makeData(1000);
    const shards = encodeErasure(original, DATA_SHARDS, PARITY_SHARDS);

    // Remove 5 shards — exceeds parity capacity
    const sparse: (Buffer | null)[] = [...shards];
    sparse[0] = null;
    sparse[1] = null;
    sparse[2] = null;
    sparse[3] = null;
    sparse[4] = null;

    expect(() =>
      decodeErasure(sparse, DATA_SHARDS, PARITY_SHARDS, original.length),
    ).toThrow();
  });

  it('should reconstruct data of various sizes correctly', () => {
    for (const size of [1, 100, 999, 1024, 10000, 99999]) {
      const original = makeData(size);
      const shards = encodeErasure(original, DATA_SHARDS, PARITY_SHARDS);
      const result = decodeErasure(shards.map(s => s), DATA_SHARDS, PARITY_SHARDS, original.length);
      expect(result.equals(original)).toBe(true);
    }
  });
});
