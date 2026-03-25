import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  UnprocessableEntityException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RecoveryService } from '../../src/modules/cluster/recovery.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  generateMnemonic,
  deriveMasterKey,
  generateKeypair,
  hash,
  createVault,
} from '@alexandria/core-sdk';

/**
 * Testes do RecoveryService — recovery via seed phrase.
 * Fonte: docs/blueprint/07-critical_flows.md (Recovery do Orquestrador via Seed Phrase)
 * Fonte: docs/backend/05-api-contracts.md (POST /api/clusters/recovery)
 *
 * Fluxo: seed → validate → master key → keypair → cluster_id → find cluster → decrypt vaults
 */

// Create real crypto data for tests
const mnemonic = generateMnemonic();
const masterKey = deriveMasterKey(mnemonic);
const { publicKey } = generateKeypair(masterKey);
const clusterId = hash(Buffer.from(publicKey));

const vaultContents = {
  credentials: { email: 'admin@familia.com', role: 'admin' },
  nodeConfigs: [{ nodeId: 'node-1', type: 's3', endpoint: 'https://s3.amazonaws.com' }],
  clusterConfig: { name: 'Familia Prado', nodeList: ['node-1'] },
};
const vaultBundle = createVault(vaultContents, 'AdminPass123', masterKey);

const mockPrisma = {
  cluster: {
    findFirst: jest.fn(),
  },
  member: {
    findMany: jest.fn(),
  },
  vault: {
    findMany: jest.fn(),
  },
  node: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  chunk: {
    count: jest.fn(),
  },
  chunkReplica: {
    count: jest.fn(),
  },
};

describe('RecoveryService', () => {
  let recoveryService: RecoveryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        RecoveryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    recoveryService = module.get<RecoveryService>(RecoveryService);
  });

  describe('recover()', () => {
    it('should recover cluster using valid seed phrase', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue({
        id: 'uuid-1',
        clusterId,
        name: 'Familia Prado',
        status: 'active',
      });
      mockPrisma.vault.findMany.mockResolvedValue([
        {
          id: 'vault-1',
          memberId: 'member-1',
          vaultData: vaultBundle.encryptedData,
          isAdminVault: true,
          encryptionAlgorithm: 'AES-256-GCM',
          member: { id: 'member-1', name: 'Admin', email: 'admin@familia.com' },
          passwordSalt: vaultBundle.passwordSalt,
          masterKeySalt: vaultBundle.masterKeySalt,
        },
      ]);
      mockPrisma.node.count.mockResolvedValue(2);
      mockPrisma.chunk.count.mockResolvedValue(100);
      mockPrisma.chunkReplica.count.mockResolvedValue(280);

      const result = await recoveryService.recover({ seedPhrase: mnemonic });

      expect(result.status).toBe('recovered');
      expect(result.recoveredVaults).toBe(1);
    });

    it('should throw BadRequestException on invalid seed phrase (not BIP-39)', async () => {
      await expect(
        recoveryService.recover({ seedPhrase: 'invalid words that are not bip39 at all here now' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnprocessableEntityException if cluster not found (wrong seed)', async () => {
      const otherMnemonic = generateMnemonic();
      mockPrisma.cluster.findFirst.mockResolvedValue(null);

      await expect(
        recoveryService.recover({ seedPhrase: otherMnemonic }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should report recovered vaults count', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue({
        id: 'uuid-1',
        clusterId,
        name: 'Familia Prado',
        status: 'active',
      });
      mockPrisma.vault.findMany.mockResolvedValue([
        {
          id: 'v1',
          memberId: 'm1',
          vaultData: vaultBundle.encryptedData,
          isAdminVault: true,
          passwordSalt: vaultBundle.passwordSalt,
          masterKeySalt: vaultBundle.masterKeySalt,
        },
        {
          id: 'v2',
          memberId: 'm2',
          vaultData: vaultBundle.encryptedData,
          isAdminVault: false,
          passwordSalt: vaultBundle.passwordSalt,
          masterKeySalt: vaultBundle.masterKeySalt,
        },
      ]);
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.chunk.count.mockResolvedValue(50);
      mockPrisma.chunkReplica.count.mockResolvedValue(140);

      const result = await recoveryService.recover({ seedPhrase: mnemonic });

      expect(result.recoveredVaults).toBe(2);
    });

    it('should include integrity check in response', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue({
        id: 'uuid-1',
        clusterId,
        name: 'Familia Prado',
        status: 'active',
      });
      mockPrisma.vault.findMany.mockResolvedValue([]);
      mockPrisma.node.count.mockResolvedValue(3);
      mockPrisma.chunk.count.mockResolvedValue(100);
      mockPrisma.chunkReplica.count.mockResolvedValue(290);

      const result = await recoveryService.recover({ seedPhrase: mnemonic });

      expect(result.integrityCheck).toBeDefined();
      expect(result.integrityCheck.totalChunks).toBe(100);
    });

    it('should report nodes connected vs offline', async () => {
      mockPrisma.cluster.findFirst.mockResolvedValue({
        id: 'uuid-1',
        clusterId,
        name: 'Familia Prado',
        status: 'active',
      });
      mockPrisma.vault.findMany.mockResolvedValue([]);
      mockPrisma.node.count
        .mockResolvedValueOnce(3)  // total nodes
        .mockResolvedValueOnce(2); // online nodes
      mockPrisma.chunk.count.mockResolvedValue(50);
      mockPrisma.chunkReplica.count.mockResolvedValue(140);

      const result = await recoveryService.recover({ seedPhrase: mnemonic });

      expect(result.nodesReconnected).toBe(2);
      expect(result.nodesOffline).toBe(1);
    });
  });
});
