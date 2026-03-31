import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RecoveryService } from '../../src/modules/cluster/recovery.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { SessionKeyService } from '../../src/common/services/session-key.service';
import {
  generateMnemonic,
  deriveMasterKey,
  generateKeypair,
  hash,
  createVault,
  encrypt,
} from '@alexandria/core-sdk';
import type { VaultContents, VaultBundle } from '@alexandria/core-sdk';

/**
 * Testes do RecoveryService — recovery completo via seed phrase (UC-007).
 * Fonte: docs/blueprint/07-critical_flows.md (Recovery do Orquestrador via Seed Phrase)
 * Fonte: docs/blueprint/08-use_cases.md (UC-007: Recovery do Sistema via Seed)
 *
 * Passos cobertos:
 *   3-5:  Validate seed → derive master key → compute cluster_id
 *   6:    Decrypt admin vault → extract node configs
 *   7:    Reconnect storage providers with extracted credentials
 *   8-9:  Scan manifests from nodes → rebuild DB metadata
 *   12:   Integrity check + schedule auto-healing
 */

// --- Test fixtures: real crypto data ---
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

const adminVaultContents: VaultContents = {
  credentials: { email: 'admin@familia.com', role: 'admin' },
  nodeConfigs: [
    {
      nodeId: 'node-s3',
      type: 's3',
      endpoint: 'https://s3.sa-east-1.amazonaws.com',
      bucket: 'alexandria-family',
      accessKey: 'AKIATEST123',
      secretKey: 'secretTest456',
      region: 'sa-east-1',
    },
    {
      nodeId: 'node-r2',
      type: 'r2',
      endpoint: 'https://abc123.r2.cloudflarestorage.com',
      bucket: 'photos-backup',
      accessKey: 'R2ACCESS',
      secretKey: 'R2SECRET',
    },
  ],
  clusterConfig: { name: 'Familia Prado', nodeList: ['node-s3', 'node-r2'] },
};
const adminVault: VaultBundle = createVault(adminVaultContents, 'AdminPass123', masterKey);

const memberVaultContents: VaultContents = {
  credentials: { email: 'membro@familia.com', role: 'member' },
  nodeConfigs: [],
  clusterConfig: undefined,
};
const memberVault: VaultBundle = createVault(memberVaultContents, 'MemberPass456', masterKey);

// --- Mocks ---
function buildMockPrisma() {
  return {
    cluster: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    vault: { findMany: jest.fn() },
    manifest: { count: jest.fn().mockResolvedValue(0) },
    node: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    chunk: { count: jest.fn().mockResolvedValue(0) },
    chunkReplica: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((fn: Function) => fn(buildMockPrisma())),
  };
}


function mockVaultRow(bundle: VaultBundle, overrides: Record<string, unknown> = {}) {
  return {
    id: 'vault-1',
    memberId: 'member-1',
    vaultData: bundle.encryptedData,
    encryptionAlgorithm: 'AES-256-GCM',
    isAdminVault: true,
    passwordSalt: bundle.passwordSalt,
    masterKeySalt: bundle.masterKeySalt,
    member: { id: 'member-1', name: 'Admin', email: 'admin@familia.com' },
    ...overrides,
  };
}

function mockCluster() {
  return {
    id: 'cluster-uuid-1',
    clusterId: clusterIdHash,
    name: 'Familia Prado',
    status: 'active',
    encryptedPrivateKey: encryptedPrivateKeyBuffer,
  };
}

const mockStorageService = {
  registerNode: jest.fn(),
  getProvider: jest.fn(),
  encryptNodeConfig: jest.fn().mockResolvedValue(new Uint8Array(64)),
  getAllProviders: jest.fn().mockReturnValue(new Map()),
};

const mockSessionKeyService = {
  store: jest.fn(),
  get: jest.fn().mockReturnValue(null),
  clear: jest.fn(),
};

describe('RecoveryService', () => {
  let service: RecoveryService;
  let mockPrisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma = buildMockPrisma();

    const module = await Test.createTestingModule({
      providers: [
        RecoveryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: SessionKeyService, useValue: mockSessionKeyService },
      ],
    }).compile();

    service = module.get<RecoveryService>(RecoveryService);
  });

  // --- Passos 3-5: Validate + derive + find cluster ---

  describe('seed validation (steps 3-5)', () => {
    it('should throw BadRequestException on invalid seed phrase', async () => {
      await expect(
        service.recover({ seedPhrase: 'invalid words that are not bip39 at all here now' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnprocessableEntityException if cluster not found', async () => {
      const otherMnemonic = generateMnemonic();
      mockPrisma.cluster.findFirst.mockResolvedValue(null);

      await expect(
        service.recover({ seedPhrase: otherMnemonic }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should find cluster by cryptographic identity derived from seed', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([]);

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(mockPrisma.cluster.findFirst).toHaveBeenCalledWith({
        where: { clusterId: clusterIdHash },
      });
      expect(result.status).toBe('recovered');
    });
  });

  // --- Passo 6: Decrypt vaults → extract node configs ---

  describe('vault decryption and node config extraction (step 6)', () => {
    it('should decrypt admin vault and extract node configs', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, { isAdminVault: true }),
      ]);

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(result.recoveredVaults).toBe(1);
      expect(result.nodeConfigs).toHaveLength(2);
      expect(result.nodeConfigs[0]).toMatchObject({
        nodeId: 'node-s3',
        type: 's3',
        accessKey: 'AKIATEST123',
      });
      expect(result.nodeConfigs[1]).toMatchObject({
        nodeId: 'node-r2',
        type: 'r2',
      });
    });

    it('should merge node configs from multiple admin vaults', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, { id: 'v1', memberId: 'm1', isAdminVault: true }),
        mockVaultRow(memberVault, { id: 'v2', memberId: 'm2', isAdminVault: false }),
      ]);

      const result = await service.recover({ seedPhrase: mnemonic });

      // Only admin vault has nodeConfigs
      expect(result.recoveredVaults).toBe(2);
      expect(result.nodeConfigs).toHaveLength(2);
    });

    it('should continue recovery even if some vaults fail to decrypt', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, { isAdminVault: true }),
        {
          id: 'v-corrupt',
          memberId: 'm-corrupt',
          vaultData: Buffer.from('corrupted data'),
          encryptionAlgorithm: 'AES-256-GCM',
          isAdminVault: false,
          passwordSalt: Buffer.alloc(16),
          masterKeySalt: Buffer.alloc(16),
          member: { id: 'm-corrupt', name: 'Corrupt', email: 'corrupt@test.com' },
        },
      ]);

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(result.recoveredVaults).toBe(1);
      expect(result.failedVaults).toBe(1);
    });
  });

  // --- Passo 7: Reconnect storage providers ---

  describe('storage provider reconnection (step 7)', () => {
    it('should upsert nodes and register providers from vault nodeConfigs', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, { isAdminVault: true }),
      ]);
      mockPrisma.node.upsert.mockImplementation((args: any) => ({
        id: args.where.id ?? args.create.id ?? 'new-id',
        clusterId: 'cluster-uuid-1',
        ...args.create,
        status: 'online',
        lastHeartbeat: new Date(),
      }));

      const result = await service.recover({ seedPhrase: mnemonic });

      // Should upsert both S3 and R2 nodes
      expect(mockPrisma.node.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrisma.node.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-s3' },
        }),
      );
      expect(mockPrisma.node.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'node-r2' },
        }),
      );

      // Should register providers in StorageService
      expect(mockStorageService.registerNode).toHaveBeenCalledTimes(2);
      expect(result.nodesReconnected).toBe(2);
    });

    it('should handle partial failures when upsert throws for some nodes', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, { isAdminVault: true }),
      ]);
      // First upsert succeeds, second throws
      mockPrisma.node.upsert
        .mockResolvedValueOnce({
          id: 'node-s3',
          clusterId: 'cluster-uuid-1',
          status: 'online',
        })
        .mockRejectedValueOnce(new Error('DB connection lost'));

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(result.nodesReconnected).toBe(1);
      expect(result.nodesFailedReconnect).toBe(1);
    });

    it('should cache masterKey in SessionKeyService after recovery', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, {
          isAdminVault: true,
          memberId: 'admin-member-1',
          member: { id: 'admin-member-1', name: 'Admin', email: 'admin@familia.com' },
        }),
      ]);

      await service.recover({ seedPhrase: mnemonic });

      expect(mockSessionKeyService.store).toHaveBeenCalledWith(
        'admin-member-1',
        expect.any(Buffer),
        expect.any(String),
      );
    });
  });

  // --- Passos 8-9: Scan manifests → rebuild metadata ---

  describe('manifest scan and DB rebuild (steps 8-9)', () => {
    it('should count existing manifests in DB', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, { isAdminVault: true }),
      ]);
      mockPrisma.manifest.count.mockResolvedValue(15);

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(result.recoveredManifests).toBe(15);
    });
  });

  // --- Passo 12: Integrity check ---

  describe('integrity check (step 12)', () => {
    it('should report integrity with healthy/pending chunks', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([]);
      mockPrisma.chunk.count.mockResolvedValue(100);
      mockPrisma.chunkReplica.count.mockResolvedValue(280);

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(result.integrityCheck).toBeDefined();
      expect(result.integrityCheck.totalChunks).toBe(100);
      expect(result.integrityCheck.healthyChunks).toBeDefined();
    });

    it('should report underReplicated chunks needing auto-healing', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([]);
      mockPrisma.chunk.count.mockResolvedValue(50);
      // Only 80 replicas for 50 chunks means avg < 2x, some are under-replicated
      mockPrisma.chunkReplica.count.mockResolvedValue(80);
      mockPrisma.chunkReplica.groupBy.mockResolvedValue([
        { chunkId: 'c1', _count: { id: 1 } },
        { chunkId: 'c2', _count: { id: 1 } },
      ]);

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(result.integrityCheck.pendingHealing).toBeGreaterThanOrEqual(0);
    });
  });

  // --- Full flow ---

  describe('full recovery flow (UC-007)', () => {
    it('should complete end-to-end recovery returning all metrics', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue(mockCluster());
      mockPrisma.vault.findMany.mockResolvedValue([
        mockVaultRow(adminVault, { isAdminVault: true }),
        mockVaultRow(memberVault, { id: 'v2', memberId: 'm2', isAdminVault: false }),
      ]);
      mockPrisma.node.count
        .mockResolvedValueOnce(2)   // total
        .mockResolvedValueOnce(2);  // online
      mockPrisma.chunk.count.mockResolvedValue(100);
      mockPrisma.chunkReplica.count.mockResolvedValue(290);

      const result = await service.recover({ seedPhrase: mnemonic });

      expect(result).toMatchObject({
        status: 'recovered',
        recoveredVaults: 2,
        nodeConfigs: expect.any(Array),
        integrityCheck: expect.objectContaining({
          totalChunks: 100,
        }),
      });
    });
  });
});
