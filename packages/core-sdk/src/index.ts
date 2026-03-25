// Alexandria Core SDK — Public API

// Hashing — SHA-256 content-addressable (RN-CH2)
export { hash, hashStream } from './hashing';

// Chunking — divisao em blocos ~4MB e reassembly (RN-CH1)
export { split, reassemble, DEFAULT_CHUNK_SIZE, type ChunkData } from './chunking';

// Crypto — AES-256-GCM encrypt/decrypt (RN-CH3, Zero-Knowledge)
export { encrypt, decrypt, generateKey, type EncryptedData } from './crypto';

// Envelope Encryption — BIP-39 seed → master key → file keys (RN-C2)
export {
  generateMnemonic,
  validateMnemonic,
  deriveMasterKey,
  generateFileKey,
  generateKeypair,
} from './crypto/envelope';

// Modulos a implementar nas proximas features:
// export * from './consistent-hash';
// export * from './manifest';
// export * from './vault';
// export * from './storage-provider';
