import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VaultService } from '../../src/modules/member/vault.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  generateMnemonic,
  deriveMasterKey,
  createVault,
  unlockVault,
  unlockVaultWithMasterKey,
} from '@alexandria/core-sdk';
import type { VaultContents, VaultBundle } from '@alexandria/core-sdk';

/**
 * Testes do VaultService.update() — atualização de conteudo do vault.
 * Fonte: docs/backend/06-services.md (VaultService)
 * Fonte: docs/blueprint/04-domain-model.md (RN-V1, RN-V4)
 *
 * - RN-V1: Admin vault contem nodeConfigs + clusterConfig
 * - RN-V4: Vault desbloqueado com senha do membro ou master key
 */

// --- Test fixtures: real crypto ---
const mnemonic = generateMnemonic();
const masterKey = deriveMasterKey(mnemonic);
const adminPassword = 'Str0ngP@ss!';

const initialContents: VaultContents = {
  credentials: { email: 'admin@familia.com', role: 'admin' },
  nodeConfigs: [],
  clusterConfig: { name: 'Familia Prado', nodeList: [] },
};

const initialBundle = createVault(initialContents, adminPassword, masterKey);

function mockVaultRow() {
  return {
    id: 'vault-1',
    memberId: 'admin-1',
    vaultData: Buffer.from(initialBundle.encryptedData),
    passwordSalt: Buffer.from(initialBundle.passwordSalt),
    masterKeySalt: Buffer.from(initialBundle.masterKeySalt),
    encryptionAlgorithm: 'AES-256-GCM',
    replicatedTo: [],
    isAdminVault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const mockPrisma = {
  vault: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
};

describe('VaultService', () => {
  let vaultService: VaultService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        VaultService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    vaultService = module.get<VaultService>(VaultService);
  });

  describe('update()', () => {
    it('should update vault contents via updater function (RN-V1)', async () => {
      const row = mockVaultRow();
      mockPrisma.vault.findUnique.mockResolvedValue(row);
      mockPrisma.vault.update.mockResolvedValue({ ...row, updatedAt: new Date() });

      const newNodeConfig = {
        nodeId: 'node-gdrive',
        type: 'google_drive',
        accessToken: 'ya29.token',
        refreshToken: '1//refresh',
        expiresAt: '2026-04-01T00:00:00Z',
        accountEmail: 'user@gmail.com',
        accountId: 'perm-id-123',
      };

      await vaultService.update('admin-1', adminPassword, masterKey, (current) => ({
        ...current,
        nodeConfigs: [...current.nodeConfigs, newNodeConfig],
      }));

      expect(mockPrisma.vault.update).toHaveBeenCalledWith({
        where: { memberId: 'admin-1' },
        data: expect.objectContaining({
          vaultData: expect.any(Uint8Array),
        }),
      });

      // Verify the updated vault can be unlocked and contains the new nodeConfig
      const updateCall = mockPrisma.vault.update.mock.calls[0][0];
      const updatedBundle: VaultBundle = {
        encryptedData: Buffer.from(updateCall.data.vaultData),
        algorithm: 'AES-256-GCM',
        passwordSalt: Buffer.from(row.passwordSalt),
        masterKeySalt: Buffer.from(row.masterKeySalt),
      };

      const unlocked = unlockVault(updatedBundle, adminPassword);
      expect(unlocked.nodeConfigs).toHaveLength(1);
      expect(unlocked.nodeConfigs[0].nodeId).toBe('node-gdrive');
      expect(unlocked.nodeConfigs[0].accessToken).toBe('ya29.token');
      expect(unlocked.credentials.email).toBe('admin@familia.com');
    });

    it('should preserve dual-layer encryption after update (RN-V4)', async () => {
      const row = mockVaultRow();
      mockPrisma.vault.findUnique.mockResolvedValue(row);
      mockPrisma.vault.update.mockResolvedValue({ ...row, updatedAt: new Date() });

      await vaultService.update('admin-1', adminPassword, masterKey, (current) => ({
        ...current,
        nodeConfigs: [{ nodeId: 'node-1', type: 's3', bucket: 'test' }],
      }));

      const updateCall = mockPrisma.vault.update.mock.calls[0][0];
      const updatedBundle: VaultBundle = {
        encryptedData: Buffer.from(updateCall.data.vaultData),
        algorithm: 'AES-256-GCM',
        passwordSalt: Buffer.from(row.passwordSalt),
        masterKeySalt: Buffer.from(row.masterKeySalt),
      };

      // Both layers should work
      const byPassword = unlockVault(updatedBundle, adminPassword);
      const byMasterKey = unlockVaultWithMasterKey(updatedBundle, masterKey);

      expect(byPassword.nodeConfigs).toEqual(byMasterKey.nodeConfigs);
      expect(byPassword.nodeConfigs[0].nodeId).toBe('node-1');
    });

    it('should add nodeConfig without duplicating by nodeId', async () => {
      // Create vault with existing nodeConfig
      const existingContents: VaultContents = {
        ...initialContents,
        nodeConfigs: [{ nodeId: 'node-1', type: 's3', bucket: 'old-bucket' }],
      };
      const existingBundle = createVault(existingContents, adminPassword, masterKey);
      const row = {
        ...mockVaultRow(),
        vaultData: Buffer.from(existingBundle.encryptedData),
        passwordSalt: Buffer.from(existingBundle.passwordSalt),
        masterKeySalt: Buffer.from(existingBundle.masterKeySalt),
      };

      mockPrisma.vault.findUnique.mockResolvedValue(row);
      mockPrisma.vault.update.mockResolvedValue({ ...row, updatedAt: new Date() });

      // Update with same nodeId but different bucket
      await vaultService.update('admin-1', adminPassword, masterKey, (current) => {
        const filtered = current.nodeConfigs.filter((nc) => nc.nodeId !== 'node-1');
        return {
          ...current,
          nodeConfigs: [...filtered, { nodeId: 'node-1', type: 's3', bucket: 'new-bucket' }],
        };
      });

      const updateCall = mockPrisma.vault.update.mock.calls[0][0];
      const updatedBundle: VaultBundle = {
        encryptedData: Buffer.from(updateCall.data.vaultData),
        algorithm: 'AES-256-GCM',
        passwordSalt: Buffer.from(row.passwordSalt),
        masterKeySalt: Buffer.from(row.masterKeySalt),
      };

      const unlocked = unlockVault(updatedBundle, adminPassword);
      expect(unlocked.nodeConfigs).toHaveLength(1);
      expect(unlocked.nodeConfigs[0].bucket).toBe('new-bucket');
    });

    it('should throw NotFoundException when vault not found', async () => {
      mockPrisma.vault.findUnique.mockResolvedValue(null);

      await expect(
        vaultService.update('unknown', adminPassword, masterKey, (c) => c),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when password is incorrect', async () => {
      const row = mockVaultRow();
      mockPrisma.vault.findUnique.mockResolvedValue(row);

      await expect(
        vaultService.update('admin-1', 'wrong-password', masterKey, (c) => c),
      ).rejects.toThrow();
    });
  });
});
