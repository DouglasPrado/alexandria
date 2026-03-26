/**
 * Matrix operations in GF(2^8).
 * Used by the Reed-Solomon encoder/decoder.
 */

import { gfAdd, gfMul, gfInverse } from './gf';

export type Matrix = number[][];

/** Create an n×m zero matrix */
export function createMatrix(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
}

/** Create an n×n identity matrix */
export function identityMatrix(n: number): Matrix {
  const m = createMatrix(n, n);
  for (let i = 0; i < n; i++) m[i]![i] = 1;
  return m;
}

/** Multiply two matrices in GF(2^8) */
export function matMul(a: Matrix, b: Matrix): Matrix {
  const rows = a.length;
  const cols = b[0]!.length;
  const inner = b.length;
  const result = createMatrix(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) {
        sum = gfAdd(sum, gfMul(a[i]![k]!, b[k]![j]!));
      }
      result[i]![j] = sum;
    }
  }
  return result;
}

/**
 * Invert a square matrix in GF(2^8) using Gaussian elimination
 * with full augmented matrix [M | I].
 * Returns the inverse, or throws if singular.
 */
export function invertMatrix(m: Matrix): Matrix {
  const n = m.length;
  // Build augmented matrix [m | identity]
  const aug: Matrix = m.map((row, i) => {
    const identity = new Array<number>(n).fill(0);
    identity[i] = 1;
    return [...row, ...identity];
  });

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivotRow = -1;
    for (let row = col; row < n; row++) {
      if (aug[row]![col] !== 0) { pivotRow = row; break; }
    }
    if (pivotRow === -1) throw new Error('Singular matrix — not enough shards to reconstruct');

    // Swap rows
    if (pivotRow !== col) {
      [aug[col], aug[pivotRow]] = [aug[pivotRow]!, aug[col]!];
    }

    // Scale pivot row so diagonal = 1
    const pivotVal = aug[col]![col]!;
    const inv = gfInverse(pivotVal);
    for (let j = 0; j < 2 * n; j++) {
      aug[col]![j] = gfMul(aug[col]![j]!, inv);
    }

    // Eliminate column in all other rows
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row]![col]!;
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j++) {
        aug[row]![j] = gfAdd(aug[row]![j]!, gfMul(factor, aug[col]![j]!));
      }
    }
  }

  // Extract right half = inverse
  return aug.map((row) => row.slice(n));
}

/**
 * Build a Cauchy matrix of size rows×cols.
 * Cauchy matrix guarantees any square submatrix is invertible.
 * Uses x_i = i, y_j = rows + j (disjoint sets to avoid division by zero).
 */
export function cauchyMatrix(rows: number, cols: number): Matrix {
  const m = createMatrix(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      m[i]![j] = gfInverse(i ^ (rows + j));
    }
  }
  return m;
}

/**
 * Build the full encoding matrix: identity (dataShards×dataShards)
 * on top, Cauchy (parityShards×dataShards) on bottom.
 * This means: first dataShards output rows = input rows unchanged;
 * remaining parityShards rows = parity computed via Cauchy.
 */
export function buildEncodingMatrix(dataShards: number, parityShards: number): Matrix {
  const identity = identityMatrix(dataShards);
  const cauchy = cauchyMatrix(parityShards, dataShards);
  return [...identity, ...cauchy];
}
