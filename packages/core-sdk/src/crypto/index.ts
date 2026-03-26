import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard nonce: 96 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/** Resultado de uma operacao de criptografia AES-256-GCM */
export interface EncryptedData {
  /** Dados criptografados */
  ciphertext: Buffer;
  /** Initialization vector (nonce) — 12 bytes, unico por operacao */
  iv: Buffer;
  /** Authentication tag — 16 bytes, garante integridade (AEAD) */
  authTag: Buffer;
}

/**
 * Gera chave AES-256 (32 bytes) via CSPRNG.
 * Usada como file key no envelope encryption.
 * Nunca persistir em disco — apenas em memoria.
 */
export function generateKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

/**
 * Criptografa dados com AES-256-GCM.
 * IV (nonce) gerado via CSPRNG a cada chamada — nunca reutilizar IV com mesma chave.
 * Auth tag garante integridade (detecta adulteracao — STRIDE/Tampering).
 *
 * @param plaintext - Dados em claro
 * @param key - Chave AES-256 (32 bytes)
 * @returns EncryptedData com ciphertext, iv e authTag
 * @throws Error se key nao tem 32 bytes
 */
export function encrypt(plaintext: Buffer, key: Buffer): EncryptedData {
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `Invalid key length: ${key.length} bytes. AES-256 requires exactly ${KEY_LENGTH} bytes.`,
    );
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return { ciphertext, iv, authTag };
}

/**
 * Descriptografa dados criptografados com AES-256-GCM.
 * Verifica auth tag antes de retornar — lanca erro se dados foram adulterados.
 *
 * @param encrypted - Dados criptografados (ciphertext + iv + authTag)
 * @param key - Chave AES-256 (32 bytes) — mesma usada no encrypt
 * @returns Buffer com dados em claro
 * @throws Error se key invalida, auth tag falha, ou dados adulterados
 */
export function decrypt(encrypted: EncryptedData, key: Buffer): Buffer {
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `Invalid key length: ${key.length} bytes. AES-256 requires exactly ${KEY_LENGTH} bytes.`,
    );
  }

  const decipher = createDecipheriv(ALGORITHM, key, encrypted.iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(encrypted.authTag);

  return Buffer.concat([decipher.update(encrypted.ciphertext), decipher.final()]);
}
