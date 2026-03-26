/**
 * Reed-Solomon erasure encoder/decoder.
 *
 * encode(data, dataShards=10, parityShards=4) → 14 equal-size shards
 * decode(shards, dataShards, parityShards, originalSize) → original data
 *
 * Any dataShards of the total dataShards+parityShards shards are sufficient
 * to reconstruct the original data (tolerates parityShards losses).
 *
 * Uses GF(2^8) arithmetic and a Cauchy encoding matrix.
 * Fonte: docs/blueprint/11-build_plan.md (Fase 3 — Erasure coding 10+4)
 */

import { gfAdd, gfMul } from './gf';
import { buildEncodingMatrix, invertMatrix } from './matrix';

/** Encode data into dataShards + parityShards equal-size shards */
export function encodeErasure(
  data: Buffer,
  dataShards: number,
  parityShards: number,
): Buffer[] {
  if (dataShards < 1 || parityShards < 1) {
    throw new Error('dataShards and parityShards must be >= 1');
  }

  // Pad data so it divides evenly into dataShards
  const shardSize = Math.ceil(data.length / dataShards);
  const padded = Buffer.alloc(shardSize * dataShards);
  data.copy(padded);

  // Extract data shards
  const shardBuffers: Buffer[] = [];
  for (let i = 0; i < dataShards; i++) {
    shardBuffers.push(padded.slice(i * shardSize, (i + 1) * shardSize));
  }

  // Get encoding matrix rows for parity (rows dataShards..dataShards+parityShards-1)
  const encMatrix = buildEncodingMatrix(dataShards, parityShards);

  // Compute parity shards
  for (let p = 0; p < parityShards; p++) {
    const parity = Buffer.alloc(shardSize);
    const row = encMatrix[dataShards + p]!;
    for (let j = 0; j < dataShards; j++) {
      const coeff = row[j]!;
      if (coeff === 0) continue;
      const src = shardBuffers[j]!;
      for (let k = 0; k < shardSize; k++) {
        parity[k] = gfAdd(parity[k]!, gfMul(coeff, src[k]!));
      }
    }
    shardBuffers.push(parity);
  }

  return shardBuffers;
}

/**
 * Reconstruct original data from available shards.
 * Pass null for missing shards. At least dataShards shards must be non-null.
 *
 * @param shards   - Array of length dataShards+parityShards (null = missing)
 * @param dataShards  - Number of data shards used during encoding
 * @param parityShards - Number of parity shards used during encoding
 * @param originalSize - Original data length (to strip padding)
 */
export function decodeErasure(
  shards: (Buffer | null)[],
  dataShards: number,
  parityShards: number,
  originalSize: number,
): Buffer {
  const totalShards = dataShards + parityShards;
  if (shards.length !== totalShards) {
    throw new Error(`Expected ${totalShards} shard slots, got ${shards.length}`);
  }

  // Collect available shard indices
  const available = shards
    .map((s, i) => (s !== null ? i : -1))
    .filter((i) => i >= 0);

  if (available.length < dataShards) {
    throw new Error(
      `Need at least ${dataShards} shards, only ${available.length} available`,
    );
  }

  // If all data shards are present, no reconstruction needed
  const allDataPresent = shards.slice(0, dataShards).every((s) => s !== null);
  if (allDataPresent) {
    const parts = shards.slice(0, dataShards) as Buffer[];
    return Buffer.concat(parts).slice(0, originalSize);
  }

  // Build sub-system: select first dataShards available shards
  const selected = available.slice(0, dataShards);

  // Get full encoding matrix and extract selected rows
  const encMatrix = buildEncodingMatrix(dataShards, parityShards);
  const subMatrix = selected.map((i) => encMatrix[i]!);

  // Invert sub-matrix
  const invMatrix = invertMatrix(subMatrix);

  // Determine shard size from any available shard
  const shardSize = (shards[available[0]!] as Buffer).length;

  // Reconstruct data shards: result[i] = sum_j(invMatrix[i][j] * shards[selected[j]])
  const reconstructed: Buffer[] = [];
  for (let i = 0; i < dataShards; i++) {
    const shard = Buffer.alloc(shardSize);
    for (let j = 0; j < dataShards; j++) {
      const coeff = invMatrix[i]![j]!;
      if (coeff === 0) continue;
      const src = shards[selected[j]!] as Buffer;
      for (let k = 0; k < shardSize; k++) {
        shard[k] = gfAdd(shard[k]!, gfMul(coeff, src[k]!));
      }
    }
    reconstructed.push(shard);
  }

  return Buffer.concat(reconstructed).slice(0, originalSize);
}
