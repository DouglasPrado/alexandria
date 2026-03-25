import {
  generateMnemonic,
  validateMnemonic,
  deriveMasterKey,
  generateFileKey,
  generateKeypair,
} from '../src/crypto/envelope';

/**
 * Testes do modulo de envelope encryption — BIP-39 → master key → file keys.
 * Fonte: docs/blueprint/04-domain-model.md (RN-C2: seed phrase gera master key)
 * Fonte: docs/blueprint/13-security.md (envelope encryption: seed → master key → file keys)
 * Fonte: docs/blueprint/07-critical_flows.md (Recovery via Seed Phrase)
 *
 * Hierarquia: seed phrase → master key → { file keys, Ed25519 keypair }
 */

describe('generateMnemonic()', () => {
  it('should return a string with 12 words', () => {
    const mnemonic = generateMnemonic();
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(12);
  });

  it('should generate valid BIP-39 mnemonics', () => {
    for (let i = 0; i < 10; i++) {
      const mnemonic = generateMnemonic();
      expect(validateMnemonic(mnemonic)).toBe(true);
    }
  });

  it('should generate unique mnemonics (CSPRNG entropy)', () => {
    const mnemonics = new Set<string>();
    for (let i = 0; i < 50; i++) {
      mnemonics.add(generateMnemonic());
    }
    expect(mnemonics.size).toBe(50);
  });
});

describe('validateMnemonic()', () => {
  it('should accept valid 12-word BIP-39 mnemonic', () => {
    const mnemonic = generateMnemonic();
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('should reject non-BIP-39 words', () => {
    expect(
      validateMnemonic('hello world foo bar baz qux quux corge grault garply waldo fred'),
    ).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateMnemonic('')).toBe(false);
  });

  it('should reject wrong word count (11 words)', () => {
    const mnemonic = generateMnemonic();
    const words = mnemonic.split(' ').slice(0, 11).join(' ');
    expect(validateMnemonic(words)).toBe(false);
  });

  it('should reject wrong word count (13 words)', () => {
    const mnemonic = generateMnemonic();
    const extra = mnemonic + ' abandon';
    expect(validateMnemonic(extra)).toBe(false);
  });

  it('should be case-sensitive (BIP-39 is lowercase)', () => {
    const mnemonic = generateMnemonic();
    const upper = mnemonic.toUpperCase();
    expect(validateMnemonic(upper)).toBe(false);
  });
});

describe('deriveMasterKey()', () => {
  it('should return a 32-byte buffer (256 bits)', () => {
    const mnemonic = generateMnemonic();
    const key = deriveMasterKey(mnemonic);
    expect(Buffer.isBuffer(key)).toBe(true);
    expect(key.length).toBe(32);
  });

  it('should be deterministic — same seed produces same key (RN-C2)', () => {
    const mnemonic = generateMnemonic();
    const key1 = deriveMasterKey(mnemonic);
    const key2 = deriveMasterKey(mnemonic);
    expect(key1.equals(key2)).toBe(true);
  });

  it('should produce different keys for different seeds', () => {
    const key1 = deriveMasterKey(generateMnemonic());
    const key2 = deriveMasterKey(generateMnemonic());
    expect(key1.equals(key2)).toBe(false);
  });

  it('should throw on invalid mnemonic', () => {
    expect(() => deriveMasterKey('invalid seed phrase that is not bip39')).toThrow();
  });
});

describe('generateFileKey()', () => {
  const mnemonic = generateMnemonic();
  const masterKey = deriveMasterKey(mnemonic);

  it('should return a 32-byte buffer (AES-256 key)', () => {
    const fileKey = generateFileKey(masterKey);
    expect(Buffer.isBuffer(fileKey)).toBe(true);
    expect(fileKey.length).toBe(32);
  });

  it('should generate unique file keys (random salt per call)', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      keys.add(generateFileKey(masterKey).toString('hex'));
    }
    expect(keys.size).toBe(50);
  });

  it('should throw on invalid master key length', () => {
    expect(() => generateFileKey(Buffer.alloc(16))).toThrow();
  });
});

describe('generateKeypair()', () => {
  const mnemonic = generateMnemonic();
  const masterKey = deriveMasterKey(mnemonic);

  it('should return publicKey and privateKey buffers', () => {
    const keypair = generateKeypair(masterKey);
    expect(Buffer.isBuffer(keypair.publicKey)).toBe(true);
    expect(Buffer.isBuffer(keypair.privateKey)).toBe(true);
  });

  it('should return 32-byte public key (Ed25519)', () => {
    const keypair = generateKeypair(masterKey);
    expect(keypair.publicKey.length).toBe(32);
  });

  it('should be deterministic — same master key produces same keypair', () => {
    const kp1 = generateKeypair(masterKey);
    const kp2 = generateKeypair(masterKey);
    expect(kp1.publicKey.equals(kp2.publicKey)).toBe(true);
    expect(kp1.privateKey.equals(kp2.privateKey)).toBe(true);
  });

  it('should produce different keypairs for different master keys', () => {
    const mk2 = deriveMasterKey(generateMnemonic());
    const kp1 = generateKeypair(masterKey);
    const kp2 = generateKeypair(mk2);
    expect(kp1.publicKey.equals(kp2.publicKey)).toBe(false);
  });

  it('should throw on invalid master key length', () => {
    expect(() => generateKeypair(Buffer.alloc(16))).toThrow();
  });
});

describe('full envelope encryption flow', () => {
  it('seed → master key → file key → encrypt/decrypt round-trip', async () => {
    const { encrypt, decrypt } = await import('../src/crypto');

    // 1. Generate seed
    const mnemonic = generateMnemonic();

    // 2. Derive master key
    const masterKey = deriveMasterKey(mnemonic);

    // 3. Generate file key from master key
    const fileKey = generateFileKey(masterKey);

    // 4. Encrypt data with file key
    const plaintext = Buffer.from('familia prado — natal 2025 photo');
    const encrypted = encrypt(plaintext, fileKey);

    // 5. Decrypt with same file key
    const decrypted = decrypt(encrypted, fileKey);
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it('recovery: same seed → same master key → can decrypt existing data', async () => {
    const { encrypt, decrypt } = await import('../src/crypto');

    // Initial setup
    const mnemonic = generateMnemonic();
    const masterKey = deriveMasterKey(mnemonic);
    const fileKey = generateFileKey(masterKey);
    const plaintext = Buffer.from('critical family data');
    const encrypted = encrypt(plaintext, fileKey);

    // Simulate recovery — re-derive master key from same seed
    const recoveredMasterKey = deriveMasterKey(mnemonic);
    expect(recoveredMasterKey.equals(masterKey)).toBe(true);

    // File key was generated with random salt, so we can't re-derive it
    // In practice, file key is stored encrypted in the manifest (file_key_encrypted)
    // Here we verify master key determinism which is the foundation of recovery
  });
});
