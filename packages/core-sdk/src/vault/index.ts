import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { encrypt, decrypt } from '../crypto';

const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 600_000;

/**
 * Conteudo do vault — estrutura tipada com credenciais e configuracoes.
 *
 * RN-V1: Vault admin contem clusterConfig + nodeConfigs com credenciais de todos os provedores.
 * RN-V2: Vault membro regular contem apenas credentials pessoais.
 */
export interface VaultContents {
  credentials: {
    email: string;
    role: string;
    [key: string]: unknown;
  };
  nodeConfigs: Array<{
    nodeId: string;
    type: string;
    endpoint?: string;
    bucket?: string;
    accessKey?: string;
    secretKey?: string;
    path?: string;
    [key: string]: unknown;
  }>;
  clusterConfig?: {
    name: string;
    nodeList: string[];
    [key: string]: unknown;
  };
}

/**
 * Vault criptografado — dados binarios + metadados para desbloqueio.
 * Contem dois layers de criptografia:
 * 1. Derivado da senha do membro (uso normal, RN-V4)
 * 2. Derivado da master key (recovery via seed, RN-V4)
 */
export interface VaultBundle {
  /** Dados criptografados (JSON serializado + AES-256-GCM) */
  encryptedData: Buffer;
  /** Algoritmo usado */
  algorithm: string;
  /** Salt para derivacao de chave a partir da senha */
  passwordSalt: Buffer;
  /** Salt para derivacao de chave a partir da master key */
  masterKeySalt: Buffer;
}

/**
 * Deriva chave AES-256 de uma senha + salt via PBKDF2.
 */
function deriveKeyFromPassword(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Deriva chave AES-256 da master key + salt via PBKDF2.
 * Salt diferente do password para que as chaves sejam independentes.
 */
function deriveKeyFromMasterKey(masterKey: Buffer, salt: Buffer): Buffer {
  return pbkdf2Sync(masterKey, salt, 1, KEY_LENGTH, 'sha256');
}

/**
 * Estrutura interna: conteudo criptografado com ambas as chaves.
 */
interface VaultInternalPayload {
  /** Conteudo criptografado com chave derivada da senha */
  byPassword: { ciphertext: string; iv: string; authTag: string };
  /** Conteudo criptografado com chave derivada da master key */
  byMasterKey: { ciphertext: string; iv: string; authTag: string };
}

/**
 * Cria vault criptografado com senha do membro E master key.
 * Dois layers independentes: desbloqueio por senha (normal) ou master key (recovery).
 *
 * RN-V4: Vault desbloqueado com senha do membro; no recovery, com master key.
 * RN-V5: Credenciais nunca em texto puro — somente dentro do vault.
 */
export function createVault(
  contents: VaultContents,
  password: string,
  masterKey: Buffer,
): VaultBundle {
  const plaintext = Buffer.from(JSON.stringify(contents), 'utf-8');

  // Generate independent salts
  const passwordSalt = randomBytes(16);
  const masterKeySalt = randomBytes(16);

  // Derive keys
  const passwordKey = deriveKeyFromPassword(password, passwordSalt);
  const masterKeyDerived = deriveKeyFromMasterKey(masterKey, masterKeySalt);

  // Encrypt with both keys independently
  const encByPassword = encrypt(plaintext, passwordKey);
  const encByMasterKey = encrypt(plaintext, masterKeyDerived);

  // Pack into internal payload
  const payload: VaultInternalPayload = {
    byPassword: {
      ciphertext: encByPassword.ciphertext.toString('base64'),
      iv: encByPassword.iv.toString('base64'),
      authTag: encByPassword.authTag.toString('base64'),
    },
    byMasterKey: {
      ciphertext: encByMasterKey.ciphertext.toString('base64'),
      iv: encByMasterKey.iv.toString('base64'),
      authTag: encByMasterKey.authTag.toString('base64'),
    },
  };

  return {
    encryptedData: Buffer.from(JSON.stringify(payload), 'utf-8'),
    algorithm: 'AES-256-GCM',
    passwordSalt,
    masterKeySalt,
  };
}

/**
 * Desbloqueia vault com senha do membro (uso normal, RN-V4).
 *
 * @throws Error se senha incorreta (auth tag falha)
 */
export function unlockVault(bundle: VaultBundle, password: string): VaultContents {
  const payload: VaultInternalPayload = JSON.parse(bundle.encryptedData.toString('utf-8'));
  const key = deriveKeyFromPassword(password, bundle.passwordSalt);

  const decrypted = decrypt(
    {
      ciphertext: Buffer.from(payload.byPassword.ciphertext, 'base64'),
      iv: Buffer.from(payload.byPassword.iv, 'base64'),
      authTag: Buffer.from(payload.byPassword.authTag, 'base64'),
    },
    key,
  );

  return JSON.parse(decrypted.toString('utf-8'));
}

/**
 * Desbloqueia vault com master key derivada da seed (recovery, RN-V4).
 *
 * @throws Error se master key incorreta (auth tag falha)
 */
export function unlockVaultWithMasterKey(bundle: VaultBundle, masterKey: Buffer): VaultContents {
  const payload: VaultInternalPayload = JSON.parse(bundle.encryptedData.toString('utf-8'));
  const key = deriveKeyFromMasterKey(masterKey, bundle.masterKeySalt);

  const decrypted = decrypt(
    {
      ciphertext: Buffer.from(payload.byMasterKey.ciphertext, 'base64'),
      iv: Buffer.from(payload.byMasterKey.iv, 'base64'),
      authTag: Buffer.from(payload.byMasterKey.authTag, 'base64'),
    },
    key,
  );

  return JSON.parse(decrypted.toString('utf-8'));
}

/**
 * Atualiza conteudo do vault. Requer senha atual para verificacao.
 * Gera novos IVs mas mantem os mesmos salts.
 *
 * @throws Error se senha incorreta
 */
export function updateVault(
  bundle: VaultBundle,
  password: string,
  masterKey: Buffer,
  newContents: VaultContents,
): VaultBundle {
  // Verify current password first
  unlockVault(bundle, password);

  // Re-create with new contents, reusing same salts for key continuity
  const plaintext = Buffer.from(JSON.stringify(newContents), 'utf-8');

  const passwordKey = deriveKeyFromPassword(password, bundle.passwordSalt);
  const masterKeyDerived = deriveKeyFromMasterKey(masterKey, bundle.masterKeySalt);

  const encByPassword = encrypt(plaintext, passwordKey);
  const encByMasterKey = encrypt(plaintext, masterKeyDerived);

  const payload: VaultInternalPayload = {
    byPassword: {
      ciphertext: encByPassword.ciphertext.toString('base64'),
      iv: encByPassword.iv.toString('base64'),
      authTag: encByPassword.authTag.toString('base64'),
    },
    byMasterKey: {
      ciphertext: encByMasterKey.ciphertext.toString('base64'),
      iv: encByMasterKey.iv.toString('base64'),
      authTag: encByMasterKey.authTag.toString('base64'),
    },
  };

  return {
    encryptedData: Buffer.from(JSON.stringify(payload), 'utf-8'),
    algorithm: 'AES-256-GCM',
    passwordSalt: bundle.passwordSalt,
    masterKeySalt: bundle.masterKeySalt,
  };
}
