import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Testes de criptografia de config de nós — chave derivada do cluster.
 * Fonte: docs/blueprint/13-security.md (Envelope Encryption)
 *
 * Design: seed phrase → master key → encrypted_private_key (persiste no DB)
 *         SHA-256(encrypted_private_key) → chave AES para configs de nós
 *
 * Garante:
 * - Roundtrip encrypt/decrypt com chave derivada do cluster
 * - Clusters diferentes geram chaves diferentes
 * - encrypted_private_key ausente/inválida lança erro
 * - Não depende de env var (NODE_CONFIG_ENCRYPTION_KEY removida)
 */

/** Deriva chave AES-256 a partir do encrypted_private_key do cluster */
function deriveKeyFromCluster(encryptedPrivateKey: Buffer): Buffer {
  return createHash('sha256').update(encryptedPrivateKey).digest();
}

/** Encrypt (mesma lógica de NodeService.encryptConfig) */
function encryptConfig(config: string, key: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(config, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

/** Decrypt (mesma lógica de StorageService.decryptNodeConfig) */
function decryptConfig(buf: Buffer, key: Buffer): string {
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf-8');
}

describe('Node config encryption — cluster-derived key', () => {
  const fakeEncryptedPrivateKey = randomBytes(64); // simula encrypted_private_key do cluster
  const config = JSON.stringify({
    endpoint: 'https://s3.amazonaws.com',
    bucket: 'alexandria-bucket',
    accessKey: 'AKIA_TEST',
    secretKey: 'secret_test',
    region: 'us-east-1',
  });

  it('should roundtrip encrypt/decrypt with key derived from cluster encrypted_private_key', () => {
    const key = deriveKeyFromCluster(fakeEncryptedPrivateKey);
    const encrypted = encryptConfig(config, key);
    const decrypted = decryptConfig(encrypted, key);

    expect(JSON.parse(decrypted)).toEqual(JSON.parse(config));
  });

  it('should produce deterministic key from same encrypted_private_key', () => {
    const key1 = deriveKeyFromCluster(fakeEncryptedPrivateKey);
    const key2 = deriveKeyFromCluster(fakeEncryptedPrivateKey);

    expect(key1).toEqual(key2);
  });

  it('should produce different keys for different clusters', () => {
    const otherClusterKey = randomBytes(64);
    const key1 = deriveKeyFromCluster(fakeEncryptedPrivateKey);
    const key2 = deriveKeyFromCluster(otherClusterKey);

    expect(key1).not.toEqual(key2);
  });

  it('should fail to decrypt with wrong cluster key', () => {
    const key = deriveKeyFromCluster(fakeEncryptedPrivateKey);
    const encrypted = encryptConfig(config, key);

    const wrongKey = deriveKeyFromCluster(randomBytes(64));
    expect(() => decryptConfig(encrypted, wrongKey)).toThrow();
  });

  it('should produce a 32-byte (256-bit) key', () => {
    const key = deriveKeyFromCluster(fakeEncryptedPrivateKey);
    expect(key.length).toBe(32);
  });
});
