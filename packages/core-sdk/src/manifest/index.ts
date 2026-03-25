import { sign, verify, createPrivateKey, createPublicKey } from 'node:crypto';
import { encrypt, type EncryptedData } from '../crypto';
/** Entrada de chunk no manifest — chunkId + posicao + tamanho */
export interface ManifestChunkEntry {
  chunkId: string;
  chunkIndex: number;
  size: number;
}

/**
 * Dados de um manifest criado pelo core-sdk.
 * Contem tudo necessario para reconstruir um arquivo e verificar integridade.
 */
export interface ManifestData {
  fileId: string;
  chunks: ManifestChunkEntry[];
  fileKeyEncrypted: EncryptedData;
  signature: Buffer;
  version: number;
}

/** Parametros para criar um manifest */
export interface CreateManifestParams {
  fileId: string;
  chunks: ManifestChunkEntry[];
  /** File key em claro — sera criptografada com masterKey */
  fileKey: Buffer;
  /** Master key para criptografar a file key (envelope encryption, RN-MA2) */
  masterKey: Buffer;
  /** Chave privada Ed25519 do cluster para assinatura (RN-MA3) */
  privateKey: Buffer;
}

/**
 * Cria manifest com file key criptografada e assinatura Ed25519.
 *
 * RN-MA2: File key criptografada com master key via AES-256-GCM.
 * RN-MA3: Manifest assinado com chave privada do cluster.
 *
 * @returns ManifestData pronto para serializacao e armazenamento
 */
export function createManifest(params: CreateManifestParams): ManifestData {
  // Encrypt file key with master key (envelope encryption)
  const fileKeyEncrypted = encrypt(params.fileKey, params.masterKey);

  // Build manifest without signature for signing
  const manifest: ManifestData = {
    fileId: params.fileId,
    chunks: params.chunks,
    fileKeyEncrypted,
    signature: Buffer.alloc(0), // placeholder
    version: 1,
  };

  // Sign the manifest content
  const dataToSign = serializeForSigning(manifest);
  manifest.signature = signManifest(dataToSign, params.privateKey);

  return manifest;
}

/**
 * Serializa os campos do manifest que sao assinados.
 * Exclui a assinatura (obvio) para gerar o payload de assinatura/verificacao.
 */
export function serializeForSigning(manifest: ManifestData): Buffer {
  const payload = {
    fileId: manifest.fileId,
    chunks: manifest.chunks,
    fileKeyEncrypted: {
      ciphertext: manifest.fileKeyEncrypted.ciphertext.toString('base64'),
      iv: manifest.fileKeyEncrypted.iv.toString('base64'),
      authTag: manifest.fileKeyEncrypted.authTag.toString('base64'),
    },
    version: manifest.version,
  };
  return Buffer.from(JSON.stringify(payload), 'utf-8');
}

/**
 * Assina dados com chave privada Ed25519 do cluster (RN-MA3).
 *
 * @param data - Dados a assinar (payload serializado do manifest)
 * @param privateKeyDer - Chave privada Ed25519 em formato PKCS8 DER
 * @returns Assinatura Ed25519
 */
export function signManifest(data: Buffer, privateKeyDer: Buffer): Buffer {
  const keyObject = createPrivateKey({
    key: privateKeyDer,
    format: 'der',
    type: 'pkcs8',
  });
  return sign(null, data, keyObject);
}

/**
 * Verifica assinatura Ed25519 do manifest (RN-MA3).
 * Manifests com assinatura invalida devem ser rejeitados.
 *
 * @param data - Dados assinados (payload serializado)
 * @param signature - Assinatura a verificar
 * @param publicKeyRaw - Chave publica Ed25519 raw (32 bytes)
 * @returns true se assinatura valida
 */
export function verifyManifest(data: Buffer, signature: Buffer, publicKeyRaw: Buffer): boolean {
  try {
    // Wrap raw 32-byte public key in SPKI DER format
    const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const spkiDer = Buffer.concat([spkiPrefix, publicKeyRaw]);

    const keyObject = createPublicKey({
      key: spkiDer,
      format: 'der',
      type: 'spki',
    });
    return verify(null, data, keyObject, signature);
  } catch {
    return false;
  }
}

/**
 * Serializa ManifestData para Buffer (JSON com campos binarios em base64).
 * Usado para armazenamento e replicacao nos nos (RN-MA4).
 */
export function serializeManifest(manifest: ManifestData): Buffer {
  const json = {
    fileId: manifest.fileId,
    chunks: manifest.chunks,
    fileKeyEncrypted: {
      ciphertext: manifest.fileKeyEncrypted.ciphertext.toString('base64'),
      iv: manifest.fileKeyEncrypted.iv.toString('base64'),
      authTag: manifest.fileKeyEncrypted.authTag.toString('base64'),
    },
    signature: manifest.signature.toString('base64'),
    version: manifest.version,
  };
  return Buffer.from(JSON.stringify(json), 'utf-8');
}

/**
 * Deserializa Buffer para ManifestData.
 * Usado no recovery para reconstruir manifests a partir dos nos.
 *
 * @throws Error se dados corrompidos ou formato invalido
 */
export function deserializeManifest(data: Buffer): ManifestData {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(data.toString('utf-8'));
  } catch {
    throw new Error('Invalid manifest data: not valid JSON.');
  }

  const enc = json.fileKeyEncrypted as Record<string, string>;
  if (!enc?.ciphertext || !enc?.iv || !enc?.authTag) {
    throw new Error('Invalid manifest data: missing fileKeyEncrypted fields.');
  }

  return {
    fileId: json.fileId as string,
    chunks: json.chunks as ManifestChunkEntry[],
    fileKeyEncrypted: {
      ciphertext: Buffer.from(enc.ciphertext, 'base64'),
      iv: Buffer.from(enc.iv, 'base64'),
      authTag: Buffer.from(enc.authTag, 'base64'),
    },
    signature: Buffer.from(json.signature as string, 'base64'),
    version: json.version as number,
  };
}
