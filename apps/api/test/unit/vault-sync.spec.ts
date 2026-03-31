import { Test } from '@nestjs/testing';
import { StorageService } from '../../src/modules/storage/storage.service';
import { VaultService } from '../../src/modules/member/vault.service';
import { SessionKeyService } from '../../src/common/services/session-key.service';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Testes do vault sync automatico em refresh de token OAuth.
 * Fonte: docs/backend/06-services.md (StorageService.onModuleInit — onTokenRefresh hook)
 *
 * Quando um token OAuth e refreshed:
 * 1. configEncrypted no DB e sempre atualizado (comportamento existente)
 * 2. Se SessionKeyService tiver masterKey+password em cache, vault tambem e atualizado
 * 3. Se nao tiver cache, apenas configEncrypted e atualizado (graceful fallback)
 */

const mockPrisma = {
  node: {
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  cluster: {
    findUnique: jest.fn(),
  },
  vault: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockVaultService = {
  update: jest.fn().mockResolvedValue(undefined),
  create: jest.fn(),
  unlock: jest.fn(),
  unlockWithMasterKey: jest.fn(),
  replicate: jest.fn(),
  syncAllNodeConfigs: jest.fn().mockResolvedValue(undefined),
};

const mockSessionKeyService = new SessionKeyService();

describe('Vault Sync on Token Refresh', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VaultService, useValue: mockVaultService },
        { provide: SessionKeyService, useValue: mockSessionKeyService },
      ],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
  });

  describe('syncNodeConfigToVault()', () => {
    it('should auto-sync vault when onTokenRefresh fires and sessionKey is cached', async () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      mockSessionKeyService.store('owner-1', masterKey, 'admin-pass');

      // Access the private method via any cast
      await (storageService as any).syncNodeConfigToVault(
        'owner-1',
        'node-1',
        { accessToken: 'new-token', refreshToken: 'new-refresh', expiresAt: '2026-04-01' },
      );

      expect(mockVaultService.update).toHaveBeenCalledWith(
        'owner-1',
        'admin-pass',
        masterKey,
        expect.any(Function),
      );
    });

    it('should skip vault sync when sessionKey is not cached (only update configEncrypted)', async () => {
      mockSessionKeyService.clear('owner-1');

      await (storageService as any).syncNodeConfigToVault(
        'owner-1',
        'node-1',
        { accessToken: 'new-token' },
      );

      expect(mockVaultService.update).not.toHaveBeenCalled();
    });

    it('should not fail if vault update throws (graceful degradation)', async () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      mockSessionKeyService.store('owner-1', masterKey, 'admin-pass');
      mockVaultService.update.mockRejectedValueOnce(new Error('Vault locked'));

      await expect(
        (storageService as any).syncNodeConfigToVault(
          'owner-1',
          'node-1',
          { accessToken: 'new-token' },
        ),
      ).resolves.toBeUndefined();
    });

    it('should update only the specific nodeConfig in vault via updater', async () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      mockSessionKeyService.store('owner-1', masterKey, 'admin-pass');

      await (storageService as any).syncNodeConfigToVault(
        'owner-1',
        'node-1',
        { accessToken: 'refreshed-token', refreshToken: 'new-refresh' },
      );

      // Verify the updater function merges token into existing nodeConfig
      const updaterFn = mockVaultService.update.mock.calls[0][3];
      const result = updaterFn({
        credentials: { email: 'admin@test.com', role: 'admin' },
        nodeConfigs: [
          { nodeId: 'node-1', type: 'google_drive', accessToken: 'old-token' },
          { nodeId: 'node-2', type: 's3', bucket: 'test' },
        ],
        clusterConfig: { name: 'Test', nodeList: [] },
      });

      expect(result.nodeConfigs).toHaveLength(2);
      const updated = result.nodeConfigs.find((nc: any) => nc.nodeId === 'node-1');
      expect(updated.accessToken).toBe('refreshed-token');
      expect(updated.refreshToken).toBe('new-refresh');

      // Other node configs should be untouched
      const other = result.nodeConfigs.find((nc: any) => nc.nodeId === 'node-2');
      expect(other.bucket).toBe('test');
    });
  });

  describe('syncAllNodeConfigs()', () => {
    it('should replace all nodeConfigs in vault via manual sync', async () => {
      const nodeConfigs = [
        { nodeId: 'node-1', type: 'google_drive', accessToken: 'token-1' },
        { nodeId: 'node-2', type: 's3', bucket: 'bucket-1' },
      ];

      await (storageService as any).syncAllNodeConfigsToVault(
        'owner-1',
        'admin-pass',
        Buffer.from('a'.repeat(64), 'hex'),
        nodeConfigs,
      );

      expect(mockVaultService.update).toHaveBeenCalledWith(
        'owner-1',
        'admin-pass',
        expect.any(Buffer),
        expect.any(Function),
      );

      // Verify the updater replaces all nodeConfigs
      const updaterFn = mockVaultService.update.mock.calls[0][3];
      const result = updaterFn({
        credentials: { email: 'admin@test.com', role: 'admin' },
        nodeConfigs: [{ nodeId: 'old-node', type: 'local' }],
        clusterConfig: { name: 'Test', nodeList: ['old-node'] },
      });

      expect(result.nodeConfigs).toEqual(nodeConfigs);
      expect(result.clusterConfig?.nodeList).toEqual(['node-1', 'node-2']);
    });
  });
});
