import {
  createVault,
  unlockVault,
  unlockVaultWithMasterKey,
  updateVault,
  type VaultBundle,
  type VaultContents,
} from '../src/vault';
import { generateMnemonic, deriveMasterKey } from '../src/crypto/envelope';

/**
 * Testes do modulo de vault — cofre criptografado por membro.
 * Fonte: docs/blueprint/04-domain-model.md (Vault, RN-V1..V5)
 *
 * - RN-V1: Vault admin contem config do cluster + credenciais de nos
 * - RN-V2: Vault membro contem credenciais pessoais
 * - RN-V4: Desbloqueio com senha (normal) ou master key (recovery)
 * - RN-V5: Credenciais nunca em texto puro
 */

const password = 'SenhaSegura123!';
const masterKey = deriveMasterKey(generateMnemonic());

const adminContents: VaultContents = {
  credentials: { email: 'admin@familia.com', role: 'admin' },
  nodeConfigs: [
    { nodeId: 'node-1', type: 's3', endpoint: 'https://s3.amazonaws.com', bucket: 'alexandria', accessKey: 'AKIA...', secretKey: 'wJal...' },
    { nodeId: 'node-2', type: 'local', path: '/mnt/nas' },
  ],
  clusterConfig: { name: 'Familia Prado', nodeList: ['node-1', 'node-2'] },
};

const memberContents: VaultContents = {
  credentials: { email: 'maria@familia.com', role: 'member' },
  nodeConfigs: [],
};

describe('createVault()', () => {
  it('should return a VaultBundle with encrypted data', () => {
    const bundle = createVault(adminContents, password, masterKey);

    expect(Buffer.isBuffer(bundle.encryptedData)).toBe(true);
    expect(bundle.encryptedData.length).toBeGreaterThan(0);
    expect(bundle.algorithm).toBe('AES-256-GCM');
  });

  it('should produce different ciphertext for same contents (unique IV)', () => {
    const a = createVault(adminContents, password, masterKey);
    const b = createVault(adminContents, password, masterKey);
    expect(a.encryptedData.equals(b.encryptedData)).toBe(false);
  });

  it('encrypted data should not contain plaintext credentials (RN-V5)', () => {
    const bundle = createVault(adminContents, password, masterKey);
    const dataStr = bundle.encryptedData.toString('utf-8');
    expect(dataStr).not.toContain('AKIA');
    expect(dataStr).not.toContain('wJal');
    expect(dataStr).not.toContain('admin@familia.com');
  });
});

describe('unlockVault()', () => {
  it('should recover original contents with correct password (RN-V4)', () => {
    const bundle = createVault(adminContents, password, masterKey);
    const unlocked = unlockVault(bundle, password);

    expect(unlocked.credentials.email).toBe('admin@familia.com');
    expect(unlocked.credentials.role).toBe('admin');
    expect(unlocked.nodeConfigs).toHaveLength(2);
    expect(unlocked.clusterConfig?.name).toBe('Familia Prado');
  });

  it('should recover member vault contents', () => {
    const bundle = createVault(memberContents, password, masterKey);
    const unlocked = unlockVault(bundle, password);

    expect(unlocked.credentials.email).toBe('maria@familia.com');
    expect(unlocked.credentials.role).toBe('member');
    expect(unlocked.nodeConfigs).toHaveLength(0);
    expect(unlocked.clusterConfig).toBeUndefined();
  });

  it('should throw with wrong password', () => {
    const bundle = createVault(adminContents, password, masterKey);
    expect(() => unlockVault(bundle, 'WrongPassword123')).toThrow();
  });
});

describe('unlockVaultWithMasterKey()', () => {
  it('should recover contents using master key for recovery (RN-V4)', () => {
    const bundle = createVault(adminContents, password, masterKey);
    const unlocked = unlockVaultWithMasterKey(bundle, masterKey);

    expect(unlocked.credentials.email).toBe('admin@familia.com');
    expect(unlocked.nodeConfigs).toHaveLength(2);
    expect(unlocked.clusterConfig?.name).toBe('Familia Prado');
  });

  it('should throw with wrong master key', () => {
    const bundle = createVault(adminContents, password, masterKey);
    const wrongMasterKey = deriveMasterKey(generateMnemonic());
    expect(() => unlockVaultWithMasterKey(bundle, wrongMasterKey)).toThrow();
  });
});

describe('updateVault()', () => {
  it('should update contents while keeping same password', () => {
    const original = createVault(adminContents, password, masterKey);

    const newContents: VaultContents = {
      ...adminContents,
      nodeConfigs: [...adminContents.nodeConfigs, { nodeId: 'node-3', type: 'r2', endpoint: 'https://r2.cloudflare.com', bucket: 'backup' }],
    };

    const updated = updateVault(original, password, masterKey, newContents);
    const unlocked = unlockVault(updated, password);

    expect(unlocked.nodeConfigs).toHaveLength(3);
    expect(unlocked.nodeConfigs[2]!.nodeId).toBe('node-3');
  });

  it('should throw with wrong password on update', () => {
    const bundle = createVault(adminContents, password, masterKey);
    expect(() => updateVault(bundle, 'WrongPass', masterKey, memberContents)).toThrow();
  });
});

describe('recovery flow', () => {
  it('seed → master key → unlock admin vault → recover node credentials', () => {
    // 1. Setup: create admin vault
    const mnemonic = generateMnemonic();
    const mk = deriveMasterKey(mnemonic);
    const bundle = createVault(adminContents, password, mk);

    // 2. Simulate disaster — only seed phrase + serialized vault survive
    const serialized = bundle.encryptedData;

    // 3. Recovery: re-derive master key from seed
    const recoveredMk = deriveMasterKey(mnemonic);

    // 4. Unlock vault with recovered master key
    const recoveredBundle: VaultBundle = {
      encryptedData: serialized,
      algorithm: 'AES-256-GCM',
      passwordSalt: bundle.passwordSalt,
      masterKeySalt: bundle.masterKeySalt,
    };
    const unlocked = unlockVaultWithMasterKey(recoveredBundle, recoveredMk);

    // 5. Verify all credentials recovered
    expect(unlocked.credentials.email).toBe('admin@familia.com');
    expect(unlocked.nodeConfigs[0]!.accessKey).toBe('AKIA...');
    expect(unlocked.clusterConfig?.nodeList).toEqual(['node-1', 'node-2']);
  });
});

describe('round-trip integrity', () => {
  it('should preserve all data types through create/unlock cycle', () => {
    const contents: VaultContents = {
      credentials: { email: 'test@test.com', role: 'reader' },
      nodeConfigs: [
        { nodeId: 'n1', type: 'b2', endpoint: 'https://b2.backblaze.com', bucket: 'test', accessKey: 'key123', secretKey: 'sec456' },
      ],
      clusterConfig: { name: 'Test Cluster', nodeList: ['n1'] },
    };

    const bundle = createVault(contents, 'TestPass123', masterKey);

    // Unlock with password
    const byPassword = unlockVault(bundle, 'TestPass123');
    expect(byPassword).toEqual(contents);

    // Unlock with master key
    const byMasterKey = unlockVaultWithMasterKey(bundle, masterKey);
    expect(byMasterKey).toEqual(contents);
  });
});
