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

// Consistent Hashing — distribuicao de chunks entre nos (ADR-006)
export { ConsistentHashRing } from './consistent-hash';

// StorageProvider — interface unificada + implementacoes (Interfaces sobre Implementacoes)
export { type StorageProvider, LocalStorageProvider } from './storage-provider';
export { S3StorageProvider, type S3StorageConfig } from './storage-provider/s3';

// Manifest — criacao, serializacao, assinatura Ed25519, verificacao (RN-MA1..MA5)
export {
  createManifest,
  serializeManifest,
  deserializeManifest,
  serializeForSigning,
  signManifest,
  verifyManifest,
  type ManifestData,
  type ManifestChunkEntry,
  type CreateManifestParams,
} from './manifest';

// Vault — cofre criptografado por membro (RN-V1..V5)
export {
  createVault,
  unlockVault,
  unlockVaultWithMasterKey,
  updateVault,
  type VaultBundle,
  type VaultContents,
} from './vault';
