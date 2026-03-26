/**
 * Galois Field GF(2^8) arithmetic.
 * Primitive polynomial: x^8 + x^4 + x^3 + x^2 + 1 = 0x11d
 *
 * Precomputed exp/log tables enable O(1) multiplication and division.
 * Addition in GF(2^8) is XOR (no carry).
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

// Build exp and log tables using primitive polynomial 0x11d
(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  // Duplicate exp table to avoid modular arithmetic in mul
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]!;
  }
})();

/** Addition in GF(2^8) = XOR */
export function gfAdd(a: number, b: number): number {
  return a ^ b;
}

/** Multiplication in GF(2^8) using exp/log tables */
export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a]! + GF_LOG[b]!) % 255]!;
}

/** Division in GF(2^8): a / b */
export function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(2^8)');
  if (a === 0) return 0;
  return GF_EXP[(GF_LOG[a]! - GF_LOG[b]! + 255) % 255]!;
}

/** Multiplicative inverse in GF(2^8) */
export function gfInverse(a: number): number {
  if (a === 0) throw new Error('No inverse for 0 in GF(2^8)');
  return GF_EXP[255 - GF_LOG[a]!]!;
}
