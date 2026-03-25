import {
  createHash,
  randomBytes,
  pbkdf2Sync,
  hkdfSync,
  createPublicKey,
  createPrivateKey,
} from 'node:crypto';
import { BIP39_WORDLIST } from './bip39-wordlist';

const KEY_LENGTH = 32; // 256 bits
const PBKDF2_ITERATIONS = 600_000; // OWASP 2023 recommendation for SHA-256
const PBKDF2_SALT = 'alexandria-mnemonic-to-master-key'; // Fixed salt — determinismo (seed = identidade)
const HKDF_INFO = 'alexandria-file-key';
const KEYPAIR_HKDF_INFO = 'alexandria-ed25519-seed';

// Pre-build word→index map for O(1) lookup
const WORD_INDEX_MAP = new Map<string, number>();
for (let i = 0; i < BIP39_WORDLIST.length; i++) {
  WORD_INDEX_MAP.set(BIP39_WORDLIST[i]!, i);
}

/**
 * Converts entropy bytes to an array of bits.
 */
function bytesToBits(bytes: Buffer): number[] {
  const bits: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;
    for (let j = 7; j >= 0; j--) {
      bits.push((byte >> j) & 1);
    }
  }
  return bits;
}

/**
 * Gera mnemonic BIP-39 de 12 palavras (128 bits de entropia).
 * Usa CSPRNG para entropia. Cada palavra vem da wordlist oficial de 2048 palavras.
 *
 * Algoritmo BIP-39:
 * 1. Gera 128 bits (16 bytes) de entropia via CSPRNG
 * 2. Calcula checksum: primeiros 4 bits do SHA-256(entropia)
 * 3. Concatena entropia + checksum = 132 bits
 * 4. Divide em 12 grupos de 11 bits → indice na wordlist
 */
export function generateMnemonic(): string {
  // 128 bits of entropy for 12 words
  const entropy = randomBytes(16);

  // SHA-256 checksum — take first 4 bits (128/32 = 4 checksum bits)
  const checksumByte = createHash('sha256').update(entropy).digest()[0]!;
  const checksumBits = checksumByte >> 4;

  // Convert entropy to bits + append 4 checksum bits
  const bits = bytesToBits(entropy);
  for (let j = 3; j >= 0; j--) {
    bits.push((checksumBits >> j) & 1);
  }

  // Split into 12 groups of 11 bits → word indices
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    let index = 0;
    for (let j = 0; j < 11; j++) {
      index = (index << 1) | bits[i * 11 + j]!;
    }
    words.push(BIP39_WORDLIST[index]!);
  }

  return words.join(' ');
}

/**
 * Valida se uma string e um mnemonic BIP-39 valido de 12 palavras.
 * Verifica: contagem de palavras, presenca na wordlist, checksum.
 */
export function validateMnemonic(mnemonic: string): boolean {
  if (!mnemonic || typeof mnemonic !== 'string') return false;

  const words = mnemonic.split(' ');
  if (words.length !== 12) return false;

  // Check all words are in wordlist and get indices
  const indices: number[] = [];
  for (const word of words) {
    const idx = WORD_INDEX_MAP.get(word);
    if (idx === undefined) return false;
    indices.push(idx);
  }

  // Convert indices to bits (12 * 11 = 132 bits)
  const bits: number[] = [];
  for (const idx of indices) {
    for (let j = 10; j >= 0; j--) {
      bits.push((idx >> j) & 1);
    }
  }

  // First 128 bits = entropy, last 4 = checksum
  const entropyBytes = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j]!;
    }
    entropyBytes[i] = byte;
  }

  // Verify checksum: first 4 bits of SHA-256(entropy)
  const expectedChecksum = createHash('sha256').update(entropyBytes).digest()[0]! >> 4;

  let actualChecksum = 0;
  for (let j = 0; j < 4; j++) {
    actualChecksum = (actualChecksum << 1) | bits[128 + j]!;
  }

  return expectedChecksum === actualChecksum;
}

/**
 * Deriva master key (32 bytes) a partir de seed phrase BIP-39.
 * Deterministico: mesma seed → mesma master key (RN-C2).
 * Usa PBKDF2 com SHA-256 e 600k iteracoes (OWASP 2023).
 * Master key NUNCA persistida em disco — apenas em memoria.
 *
 * @throws Error se mnemonic invalido
 */
export function deriveMasterKey(mnemonic: string): Buffer {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid BIP-39 mnemonic. Must be 12 valid words from the BIP-39 English wordlist.');
  }

  return pbkdf2Sync(
    mnemonic,
    PBKDF2_SALT,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256',
  );
}

/**
 * Gera file key (32 bytes) derivada da master key via HKDF.
 * Cada chamada produz uma chave unica (salt random).
 * Envelope encryption: master key → file key → AES-256-GCM por chunk.
 * File key e armazenada criptografada no manifest (file_key_encrypted).
 *
 * @throws Error se master key invalida
 */
export function generateFileKey(masterKey: Buffer): Buffer {
  if (masterKey.length !== KEY_LENGTH) {
    throw new Error(`Invalid master key length: ${masterKey.length} bytes. Expected ${KEY_LENGTH}.`);
  }

  const salt = randomBytes(16);
  const derived = hkdfSync('sha256', masterKey, salt, HKDF_INFO, KEY_LENGTH);
  return Buffer.from(derived);
}

/**
 * Gera par de chaves Ed25519 deterministicamente a partir da master key.
 * Usado para identidade criptografica do cluster (RN-C1).
 * Deterministico: mesma master key → mesmo keypair → mesmo cluster_id.
 *
 * @returns { publicKey: Buffer (32 bytes), privateKey: Buffer }
 * @throws Error se master key invalida
 */
export function generateKeypair(masterKey: Buffer): { publicKey: Buffer; privateKey: Buffer } {
  if (masterKey.length !== KEY_LENGTH) {
    throw new Error(`Invalid master key length: ${masterKey.length} bytes. Expected ${KEY_LENGTH}.`);
  }

  // Derive a deterministic 32-byte seed for Ed25519 from master key via HKDF
  const ed25519Seed = Buffer.from(
    hkdfSync('sha256', masterKey, Buffer.alloc(0), KEYPAIR_HKDF_INFO, 32),
  );

  // Generate Ed25519 keypair from deterministic seed via PKCS8 DER
  const privateKeyObject = createPrivateKey({
    key: Buffer.concat([
      // Ed25519 PKCS8 DER prefix for a 32-byte seed
      Buffer.from('302e020100300506032b657004220420', 'hex'),
      ed25519Seed,
    ]),
    format: 'der',
    type: 'pkcs8',
  });

  const publicKeyObject = createPublicKey(privateKeyObject);

  // Export raw keys
  const publicKeyDer = publicKeyObject.export({ type: 'spki', format: 'der' });
  const privateKeyDer = privateKeyObject.export({ type: 'pkcs8', format: 'der' });

  // Extract raw 32-byte public key from SPKI DER (last 32 bytes)
  const publicKey = publicKeyDer.subarray(publicKeyDer.length - 32);

  return {
    publicKey: Buffer.from(publicKey),
    privateKey: Buffer.from(privateKeyDer),
  };
}
