import {
  createManifest,
  serializeManifest,
  deserializeManifest,
  signManifest,
  verifyManifest,
  type ManifestData,
} from '../src/manifest';
import { generateKey, encrypt, decrypt } from '../src/crypto';
import {
  generateMnemonic,
  deriveMasterKey,
  generateKeypair,
  generateFileKey,
} from '../src/crypto/envelope';
import type { ManifestChunkEntry } from '../src/manifest';

/**
 * Testes do modulo de manifest — criacao, serializacao, assinatura e validacao.
 * Fonte: docs/blueprint/04-domain-model.md (Manifest, RN-MA1..MA5)
 * Fonte: docs/backend/06-services.md (StorageService.createManifest)
 *
 * - RN-MA2: file key criptografada com master key (envelope encryption)
 * - RN-MA3: assinatura criptografica com chave privada do cluster
 * - RN-MA5: fonte de verdade para recovery via seed
 */

// Setup: generate cluster keys for signing
const mnemonic = generateMnemonic();
const masterKey = deriveMasterKey(mnemonic);
const { publicKey, privateKey } = generateKeypair(masterKey);

const sampleChunks: ManifestChunkEntry[] = [
  { chunkId: 'aabb'.repeat(16), chunkIndex: 0, size: 4 * 1024 * 1024 },
  { chunkId: 'ccdd'.repeat(16), chunkIndex: 1, size: 4 * 1024 * 1024 },
  { chunkId: 'eeff'.repeat(16), chunkIndex: 2, size: 2 * 1024 * 1024 },
];

describe('createManifest()', () => {
  it('should return a ManifestData with all required fields', () => {
    const fileKey = generateFileKey(masterKey);
    const manifest = createManifest({
      fileId: 'file-123',
      chunks: sampleChunks,
      fileKey,
      masterKey,
      privateKey,
    });

    expect(manifest.fileId).toBe('file-123');
    expect(manifest.chunks).toHaveLength(3);
    expect(Buffer.isBuffer(manifest.fileKeyEncrypted.ciphertext)).toBe(true);
    expect(Buffer.isBuffer(manifest.fileKeyEncrypted.iv)).toBe(true);
    expect(Buffer.isBuffer(manifest.fileKeyEncrypted.authTag)).toBe(true);
    expect(Buffer.isBuffer(manifest.signature)).toBe(true);
    expect(manifest.version).toBe(1);
  });

  it('should encrypt the file key with master key (RN-MA2)', () => {
    const fileKey = generateFileKey(masterKey);
    const manifest = createManifest({
      fileId: 'file-456',
      chunks: sampleChunks,
      fileKey,
      masterKey,
      privateKey,
    });

    // Decrypt should recover original file key
    const decrypted = decrypt(manifest.fileKeyEncrypted, masterKey);
    expect(decrypted.equals(fileKey)).toBe(true);
  });

  it('should sign the manifest with cluster private key (RN-MA3)', () => {
    const fileKey = generateFileKey(masterKey);
    const manifest = createManifest({
      fileId: 'file-789',
      chunks: sampleChunks,
      fileKey,
      masterKey,
      privateKey,
    });

    expect(manifest.signature.length).toBeGreaterThan(0);
  });

  it('should preserve chunk order', () => {
    const fileKey = generateFileKey(masterKey);
    const manifest = createManifest({
      fileId: 'file-order',
      chunks: sampleChunks,
      fileKey,
      masterKey,
      privateKey,
    });

    manifest.chunks.forEach((chunk, i) => {
      expect(chunk.chunkIndex).toBe(i);
      expect(chunk.chunkId).toBe(sampleChunks[i]!.chunkId);
    });
  });
});

describe('signManifest() / verifyManifest()', () => {
  it('should produce a valid signature that verifies with public key', () => {
    const data = Buffer.from('manifest content to sign');
    const signature = signManifest(data, privateKey);

    expect(verifyManifest(data, signature, publicKey)).toBe(true);
  });

  it('should reject tampered data', () => {
    const data = Buffer.from('original data');
    const signature = signManifest(data, privateKey);

    const tampered = Buffer.from('tampered data');
    expect(verifyManifest(tampered, signature, publicKey)).toBe(false);
  });

  it('should reject tampered signature', () => {
    const data = Buffer.from('some data');
    const signature = signManifest(data, privateKey);

    const tamperedSig = Buffer.from(signature);
    tamperedSig[0] ^= 0xff;
    expect(verifyManifest(data, tamperedSig, publicKey)).toBe(false);
  });

  it('should reject signature from different keypair', () => {
    const otherMasterKey = deriveMasterKey(generateMnemonic());
    const otherKeypair = generateKeypair(otherMasterKey);

    const data = Buffer.from('cross-key test');
    const signature = signManifest(data, otherKeypair.privateKey);

    expect(verifyManifest(data, signature, publicKey)).toBe(false);
  });
});

describe('serializeManifest() / deserializeManifest()', () => {
  it('should round-trip serialize/deserialize a manifest', () => {
    const fileKey = generateFileKey(masterKey);
    const original = createManifest({
      fileId: 'file-serial',
      chunks: sampleChunks,
      fileKey,
      masterKey,
      privateKey,
    });

    const serialized = serializeManifest(original);
    expect(Buffer.isBuffer(serialized)).toBe(true);

    const restored = deserializeManifest(serialized);

    expect(restored.fileId).toBe(original.fileId);
    expect(restored.chunks).toEqual(original.chunks);
    expect(restored.version).toBe(original.version);
    expect(restored.fileKeyEncrypted.ciphertext.equals(original.fileKeyEncrypted.ciphertext)).toBe(
      true,
    );
    expect(restored.fileKeyEncrypted.iv.equals(original.fileKeyEncrypted.iv)).toBe(true);
    expect(restored.fileKeyEncrypted.authTag.equals(original.fileKeyEncrypted.authTag)).toBe(true);
    expect(restored.signature.equals(original.signature)).toBe(true);
  });

  it('should throw on corrupted data', () => {
    expect(() => deserializeManifest(Buffer.from('not valid json'))).toThrow();
  });

  it('should preserve binary fields through serialization', () => {
    const fileKey = generateFileKey(masterKey);
    const manifest = createManifest({
      fileId: 'file-binary',
      chunks: sampleChunks,
      fileKey,
      masterKey,
      privateKey,
    });

    const restored = deserializeManifest(serializeManifest(manifest));

    // File key should still be decryptable
    const recoveredFileKey = decrypt(restored.fileKeyEncrypted, masterKey);
    expect(recoveredFileKey.equals(fileKey)).toBe(true);

    // Signature should still verify
    const signedData = serializeManifestForSigning(restored);
    expect(verifyManifest(signedData, restored.signature, publicKey)).toBe(true);
  });
});

describe('full manifest flow (recovery scenario)', () => {
  it('seed → master key → decrypt file key from manifest → decrypt chunks', () => {
    // 1. Original upload: create manifest with encrypted file key
    const fileKey = generateFileKey(masterKey);
    const manifest = createManifest({
      fileId: 'recovery-file',
      chunks: sampleChunks,
      fileKey,
      masterKey,
      privateKey,
    });

    // 2. Serialize and store (simulating replication to nodes)
    const stored = serializeManifest(manifest);

    // 3. Recovery: re-derive master key from same seed
    const recoveredMasterKey = deriveMasterKey(mnemonic);

    // 4. Deserialize manifest from node
    const recovered = deserializeManifest(stored);

    // 5. Verify signature with cluster public key
    const recoveredKeypair = generateKeypair(recoveredMasterKey);
    const signedData = serializeManifestForSigning(recovered);
    expect(verifyManifest(signedData, recovered.signature, recoveredKeypair.publicKey)).toBe(true);

    // 6. Decrypt file key with recovered master key
    const recoveredFileKey = decrypt(recovered.fileKeyEncrypted, recoveredMasterKey);
    expect(recoveredFileKey.equals(fileKey)).toBe(true);
  });
});

// Helper to get the signing payload — will be exported from manifest module
function serializeManifestForSigning(manifest: ManifestData): Buffer {
  const { serializeForSigning } = require('../src/manifest');
  return serializeForSigning(manifest);
}
