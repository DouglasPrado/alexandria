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
  serializeManifest,
  type ManifestData,
} from '@alexandria/core-sdk';
import type { VaultContents, VaultBundle } from '@alexandria/core-sdk';

/**
 * Teste de disaster recovery end-to-end (UC-007).
 * Simula o cenario completo:
 *   1. Cluster com identidade criptografica
 *   2. Admin vault com nodeConfigs (Google Drive + S3)
 *   3. Providers com chunks e manifests
 *   4. Recovery por seed phrase → reconexao → reindex
 *
 * Fonte: docs/blueprint/07-critical_flows.md (Recovery do Orquestrador via Seed Phrase)
 */

// --- 1. Identidade criptografica real ---
const mnemonic = generateMnemonic();
const masterKey = deriveMasterKey(mnemonic);
const { publicKey, privateKey } = generateKeypair(masterKey);
const clusterIdHash = hash(Buffer.from(publicKey));
const encResult = encrypt(Buffer.from(privateKey), masterKey);
const encryptedPrivateKeyBuffer = Buffer.concat([
  encResult.iv,
  encResult.authTag,
  encResult.ciphertext,
]);

// --- 2. Admin vault com 2 nos cloud ---
const adminVaultContents: VaultContents = {
  credentials: { email: 'admin@familia.com', role: 'admin' },
  nodeConfigs: [
    {
      nodeId: 'node-gdrive',
      type: 'google_drive',
      accessToken: 'ya29.test-token',
      refreshToken: '1//test-refresh',
      expiresAt: '2026-12-31T00:00:00Z',
      accountEmail: 'familia@gmail.com',
      accountId: 'perm-id-123',
    },
    {
      nodeId: 'node-s3',
      type: 's3',
      endpoint: 'https://s3.sa-east-1.amazonaws.com',
      bucket: 'alexandria-fotos',
      accessKey: 'AKIATEST',
      secretKey: 'secretTest',
      region: 'sa-east-1',
    },
  ],
  clusterConfig: { name: 'Familia Prado', nodeList: ['node-gdrive', 'node-s3'] },
};
const adminVault: VaultBundle = createVault(adminVaultContents, 'AdminPass123!', masterKey);

// --- 3. Mock providers com chunks e manifests ---
const CHUNK_HASH_1 = 'a'.repeat(64);
const CHUNK_HASH_2 = 'b'.repeat(64);
const FILE_ID = 'file-uuid-fotos';

const manifestData: ManifestData = {
  fileId: FILE_ID,
  chunks: [
    { chunkId: CHUNK_HASH_1, chunkIndex: 0, size: 4096 },
    { chunkId: CHUNK_HASH_2, chunkIndex: 1, size: 2048 },
  ],
  fileKeyEncrypted: encrypt(Buffer.from('fake-file-key'), masterKey),
  signature: Buffer.from('fake-signature'),
  version: 1,
};
const serializedManifest = serializeManifest(manifestData);

function createMockProvider(keys: string[], manifestBuffer?: Buffer) {
  return {
    put: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockImplementation(async (key: string) => {
      if (key.startsWith('manifest:') && manifestBuffer) return manifestBuffer;
      return Buffer.alloc(4096); // dummy chunk data
    }),
    exists: jest.fn().mockResolvedValue(true),
    delete: jest.fn(),
    list: jest.fn().mockResolvedValue(keys),
    capacity: jest.fn().mockResolvedValue({ total: BigInt(100e9), used: BigInt(10e9) }),
  };
}

describe('Disaster Recovery E2E (UC-007)', () => {
  let recoveryService: RecoveryService;
  let sessionKeyService: SessionKeyService;

  // Providers simulam storage com dados reais
  const gdriveProvider = createMockProvider(
    [`manifest:${FILE_ID}`, CHUNK_HASH_1, `preview:${FILE_ID}.webp`],
    serializedManifest,
  );
  const s3Provider = createMockProvider(
    [CHUNK_HASH_1, CHUNK_HASH_2],
  );

  const mockStorageService = {
    registerNode: jest.fn(),
    getProvider: jest.fn(),
    encryptNodeConfig: jest.fn().mockResolvedValue(new Uint8Array(64)),
    getAllProviders: jest.fn().mockReturnValue(new Map([
      ['node-gdrive', gdriveProvider],
      ['node-s3', s3Provider],
    ])),
  };

  const mockPrisma = {
    cluster: { findFirst: jest.fn(), findUnique: jest.fn() },
    vault: { findMany: jest.fn() },
    manifest: { count: jest.fn().mockResolvedValue(0), upsert: jest.fn() },
    node: {
      count: jest.fn(),
      upsert: jest.fn().mockImplementation((args: any) => ({
        id: args.where.id,
        clusterId: 'cluster-1',
        status: 'online',
      })),
    },
    chunk: { count: jest.fn().mockResolvedValue(0), upsert: jest.fn() },
    chunkReplica: { count: jest.fn().mockResolvedValue(0), upsert: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    sessionKeyService = new SessionKeyService();

    const module = await Test.createTestingModule({
      providers: [
        RecoveryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: SessionKeyService, useValue: sessionKeyService },
      ],
    }).compile();

    recoveryService = module.get<RecoveryService>(RecoveryService);
  });

  it('should complete full disaster recovery: seed → vault → reconnect → reindex', async () => {
    // Setup: cluster exists, admin vault encrypted, providers have data
    mockPrisma.cluster.findFirst.mockResolvedValue({
      id: 'cluster-1',
      clusterId: clusterIdHash,
      name: 'Familia Prado',
      status: 'active',
      encryptedPrivateKey: encryptedPrivateKeyBuffer,
    });
    mockPrisma.vault.findMany.mockResolvedValue([{
      id: 'vault-1',
      memberId: 'admin-1',
      vaultData: adminVault.encryptedData,
      encryptionAlgorithm: 'AES-256-GCM',
      isAdminVault: true,
      passwordSalt: adminVault.passwordSalt,
      masterKeySalt: adminVault.masterKeySalt,
      member: { id: 'admin-1', name: 'Admin', email: 'admin@familia.com' },
    }]);
    mockPrisma.node.count
      .mockResolvedValueOnce(2)  // totalNodes
      .mockResolvedValueOnce(2); // onlineNodes

    // --- Execute Recovery ---
    const result = await recoveryService.recover({ seedPhrase: mnemonic });

    // --- Verify: Steps 3-5 (cluster found) ---
    expect(result.status).toBe('recovered');

    // --- Verify: Step 6 (vault decrypted, nodeConfigs extracted) ---
    expect(result.recoveredVaults).toBe(1);
    expect(result.nodeConfigs).toHaveLength(2);
    expect(result.nodeConfigs[0]).toMatchObject({
      nodeId: 'node-gdrive',
      type: 'google_drive',
      accessToken: 'ya29.test-token',
    });
    expect(result.nodeConfigs[1]).toMatchObject({
      nodeId: 'node-s3',
      type: 's3',
      accessKey: 'AKIATEST',
    });

    // --- Verify: Step 7 (providers reconnected) ---
    expect(result.nodesReconnected).toBe(2);
    expect(mockPrisma.node.upsert).toHaveBeenCalledTimes(2);
    expect(mockStorageService.registerNode).toHaveBeenCalledTimes(2);

    // --- Verify: Steps 8-9 (chunks and manifests scanned) ---
    expect(result.discoveredManifests).toBe(1);
    expect(result.discoveredChunks).toBeGreaterThan(0);

    // Google Drive provider scanned: 1 manifest, 1 chunk, 1 preview (skipped)
    expect(gdriveProvider.list).toHaveBeenCalled();
    expect(gdriveProvider.get).toHaveBeenCalledWith(`manifest:${FILE_ID}`);

    // S3 provider scanned: 2 chunks
    expect(s3Provider.list).toHaveBeenCalled();

    // Chunks upserted in DB
    expect(mockPrisma.chunk.upsert).toHaveBeenCalled();
    expect(mockPrisma.chunkReplica.upsert).toHaveBeenCalled();

    // --- Verify: Session key cached for subsequent operations ---
    const cached = sessionKeyService.get('admin-1');
    expect(cached).not.toBeNull();
    expect(cached!.masterKey).toEqual(masterKey);
  });

  it('should handle recovery with empty providers (fresh DB rebuild)', async () => {
    mockPrisma.cluster.findFirst.mockResolvedValue({
      id: 'cluster-1',
      clusterId: clusterIdHash,
      name: 'Familia Prado',
      status: 'active',
      encryptedPrivateKey: encryptedPrivateKeyBuffer,
    });
    mockPrisma.vault.findMany.mockResolvedValue([{
      id: 'vault-1',
      memberId: 'admin-1',
      vaultData: adminVault.encryptedData,
      encryptionAlgorithm: 'AES-256-GCM',
      isAdminVault: true,
      passwordSalt: adminVault.passwordSalt,
      masterKeySalt: adminVault.masterKeySalt,
      member: { id: 'admin-1', name: 'Admin', email: 'admin@familia.com' },
    }]);
    mockPrisma.node.count.mockResolvedValue(0);

    // Providers have no data
    mockStorageService.getAllProviders.mockReturnValue(new Map([
      ['node-gdrive', createMockProvider([])],
      ['node-s3', createMockProvider([])],
    ]));

    const result = await recoveryService.recover({ seedPhrase: mnemonic });

    expect(result.status).toBe('recovered');
    expect(result.nodesReconnected).toBe(2);
    expect(result.discoveredManifests).toBe(0);
    expect(result.discoveredChunks).toBe(0);
  });
});
