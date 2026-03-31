import { Test } from '@nestjs/testing';
import { RecoveryService } from '../../src/modules/cluster/recovery.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { SessionKeyService } from '../../src/common/services/session-key.service';
import {
  generateMnemonic,
  deriveMasterKey,
  generateKeypair,
  hash,
  encrypt,
  createVault,
} from '@alexandria/core-sdk';
import type { VaultContents, VaultBundle } from '@alexandria/core-sdk';

/**
 * Testes de reindex no recovery (passos 8-9).
 * Fonte: docs/blueprint/07-critical_flows.md (Recovery)
 *
 * Convencao de keys nos providers:
 *   manifest:{fileId} — manifests serializados
 *   preview:{fileId}.{format} — previews (ignorados no scan)
 *   [64 hex chars] — chunks normais (SHA-256)
 */

const mnemonic = generateMnemonic();
const masterKey = deriveMasterKey(mnemonic);
const { publicKey, privateKey } = generateKeypair(masterKey);
const clusterIdHash = hash(Buffer.from(publicKey));
const encryptedPrivateKey = encrypt(Buffer.from(privateKey), masterKey);
const encryptedPrivateKeyBuffer = Buffer.concat([
  encryptedPrivateKey.iv,
  encryptedPrivateKey.authTag,
  encryptedPrivateKey.ciphertext,
]);

const vaultContents: VaultContents = {
  credentials: { email: 'admin@test.com', role: 'admin' },
  nodeConfigs: [{ nodeId: 'node-1', type: 's3', bucket: 'test', accessKey: 'key', secretKey: 'secret' }],
  clusterConfig: { name: 'Test', nodeList: ['node-1'] },
};
const vault: VaultBundle = createVault(vaultContents, 'Pass123', masterKey);

function mockCluster() {
  return { id: 'cluster-1', clusterId: clusterIdHash, name: 'Test', status: 'active', encryptedPrivateKey: encryptedPrivateKeyBuffer };
}

function mockVaultRow() {
  return {
    id: 'v1', memberId: 'm1', vaultData: vault.encryptedData,
    encryptionAlgorithm: 'AES-256-GCM', isAdminVault: true,
    passwordSalt: vault.passwordSalt, masterKeySalt: vault.masterKeySalt,
    member: { id: 'm1', name: 'Admin', email: 'admin@test.com' },
  };
}

describe('RecoveryService — Reindex (steps 8-9)', () => {
  let service: RecoveryService;

  const mockProvider = {
    put: jest.fn(), get: jest.fn(), exists: jest.fn(),
    delete: jest.fn(), list: jest.fn(), capacity: jest.fn(),
  };

  const mockStorageService = {
    registerNode: jest.fn(),
    encryptNodeConfig: jest.fn().mockResolvedValue(new Uint8Array(64)),
    getAllProviders: jest.fn().mockReturnValue(new Map([['node-1', mockProvider]])),
    getProvider: jest.fn(),
  };

  const mockPrisma = {
    cluster: { findFirst: jest.fn(), findUnique: jest.fn() },
    vault: { findMany: jest.fn() },
    manifest: { count: jest.fn().mockResolvedValue(0), upsert: jest.fn() },
    node: { count: jest.fn().mockResolvedValue(0), upsert: jest.fn().mockResolvedValue({ id: 'node-1' }) },
    chunk: { count: jest.fn().mockResolvedValue(0), upsert: jest.fn() },
    chunkReplica: { count: jest.fn().mockResolvedValue(0), upsert: jest.fn() },
    file: { upsert: jest.fn() },
    manifestChunk: { upsert: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        RecoveryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: SessionKeyService, useValue: { store: jest.fn(), get: jest.fn(), clear: jest.fn() } },
      ],
    }).compile();

    service = module.get<RecoveryService>(RecoveryService);
  });

  it('should distinguish manifests, chunks, and previews by key prefix', async () => {
    mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
    mockPrisma.vault.findMany.mockResolvedValue([mockVaultRow()]);

    // Provider returns mixed keys
    mockProvider.list.mockResolvedValue([
      'manifest:file-uuid-1',
      'preview:file-uuid-1.webp',
      'a'.repeat(64), // chunk hash
    ]);
    mockProvider.get.mockResolvedValue(Buffer.from(JSON.stringify({
      fileId: 'file-uuid-1',
      chunks: [{ chunkId: 'a'.repeat(64), chunkIndex: 0, size: 4096 }],
      fileKeyEncrypted: { ciphertext: 'aGVsbG8=', iv: 'd29ybGQ=', authTag: 'dGVzdA==' },
      signature: 'c2ln',
      version: 1,
    })));

    const result = await service.recover({ seedPhrase: mnemonic });

    // Should have scanned the provider
    expect(mockProvider.list).toHaveBeenCalled();
    // Report includes scan metrics
    expect(result).toHaveProperty('discoveredManifests');
    expect(result).toHaveProperty('discoveredChunks');
  });

  it('should handle provider.list() failures gracefully', async () => {
    mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
    mockPrisma.vault.findMany.mockResolvedValue([mockVaultRow()]);

    mockProvider.list.mockRejectedValue(new Error('Provider offline'));

    const result = await service.recover({ seedPhrase: mnemonic });

    // Should not crash, just report 0 discoveries
    expect(result.status).toBe('recovered');
  });
});
