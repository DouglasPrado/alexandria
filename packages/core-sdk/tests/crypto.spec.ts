import { encrypt, decrypt, generateKey, type EncryptedData } from '../src/crypto';

/**
 * Testes do modulo de criptografia — AES-256-GCM.
 * Fonte: docs/blueprint/13-security.md (Dados em Repouso)
 * Fonte: docs/blueprint/02-architecture_principles.md (Zero-Knowledge)
 * - RN-CH3: Todo chunk criptografado com AES-256-GCM antes de armazenamento
 * - AES-256-GCM e autenticado — detecta adulteracao (STRIDE/Tampering)
 */

describe('generateKey()', () => {
  it('should return a 32-byte buffer (256 bits)', () => {
    const key = generateKey();
    expect(Buffer.isBuffer(key)).toBe(true);
    expect(key.length).toBe(32);
  });

  it('should generate unique keys (CSPRNG)', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateKey().toString('hex'));
    }
    expect(keys.size).toBe(100);
  });
});

describe('encrypt()', () => {
  const key = generateKey();

  it('should return EncryptedData with ciphertext, iv, and authTag', () => {
    const plaintext = Buffer.from('hello alexandria');
    const result = encrypt(plaintext, key);

    expect(Buffer.isBuffer(result.ciphertext)).toBe(true);
    expect(Buffer.isBuffer(result.iv)).toBe(true);
    expect(Buffer.isBuffer(result.authTag)).toBe(true);
  });

  it('should produce a 12-byte IV (GCM standard nonce)', () => {
    const result = encrypt(Buffer.from('test'), key);
    expect(result.iv.length).toBe(12);
  });

  it('should produce a 16-byte auth tag', () => {
    const result = encrypt(Buffer.from('test'), key);
    expect(result.authTag.length).toBe(16);
  });

  it('should produce ciphertext different from plaintext', () => {
    const plaintext = Buffer.from('sensitive family photo data');
    const result = encrypt(plaintext, key);
    expect(result.ciphertext.equals(plaintext)).toBe(false);
  });

  it('should produce different ciphertext for same plaintext (unique IV)', () => {
    const plaintext = Buffer.from('same content encrypted twice');
    const a = encrypt(plaintext, key);
    const b = encrypt(plaintext, key);

    // IVs must differ (random)
    expect(a.iv.equals(b.iv)).toBe(false);
    // Ciphertexts must differ (different IV → different ciphertext)
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
  });

  it('should handle empty plaintext', () => {
    const result = encrypt(Buffer.alloc(0), key);
    expect(result.ciphertext.length).toBe(0);
    expect(result.iv.length).toBe(12);
    expect(result.authTag.length).toBe(16);
  });

  it('should handle large plaintext (4MB chunk)', () => {
    const plaintext = Buffer.alloc(4 * 1024 * 1024, 0xab);
    const result = encrypt(plaintext, key);
    expect(result.ciphertext.length).toBe(plaintext.length);
  });

  it('should throw on invalid key length', () => {
    expect(() => encrypt(Buffer.from('test'), Buffer.alloc(16))).toThrow();
    expect(() => encrypt(Buffer.from('test'), Buffer.alloc(0))).toThrow();
    expect(() => encrypt(Buffer.from('test'), Buffer.alloc(64))).toThrow();
  });
});

describe('decrypt()', () => {
  const key = generateKey();

  it('should recover original plaintext', () => {
    const plaintext = Buffer.from('familia prado memories 2026');
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it('should handle empty plaintext round-trip', () => {
    const plaintext = Buffer.alloc(0);
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted.length).toBe(0);
  });

  it('should handle large plaintext round-trip (4MB)', () => {
    const plaintext = Buffer.alloc(4 * 1024 * 1024);
    for (let i = 0; i < plaintext.length; i++) plaintext[i] = i % 256;

    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it('should fail with wrong key (auth tag verification)', () => {
    const plaintext = Buffer.from('secret data');
    const encrypted = encrypt(plaintext, key);
    const wrongKey = generateKey();

    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });

  it('should fail if ciphertext is tampered (STRIDE/Tampering)', () => {
    const plaintext = Buffer.from('tamper detection test');
    const encrypted = encrypt(plaintext, key);

    // Tamper with ciphertext
    const tampered: EncryptedData = {
      ...encrypted,
      ciphertext: Buffer.from(encrypted.ciphertext),
    };
    if (tampered.ciphertext.length > 0) {
      tampered.ciphertext[0] ^= 0xff;
    }

    expect(() => decrypt(tampered, key)).toThrow();
  });

  it('should fail if auth tag is tampered', () => {
    const plaintext = Buffer.from('auth tag integrity');
    const encrypted = encrypt(plaintext, key);

    const tampered: EncryptedData = {
      ...encrypted,
      authTag: Buffer.from(encrypted.authTag),
    };
    tampered.authTag[0] ^= 0xff;

    expect(() => decrypt(tampered, key)).toThrow();
  });

  it('should fail if IV is tampered', () => {
    const plaintext = Buffer.from('iv integrity check');
    const encrypted = encrypt(plaintext, key);

    const tampered: EncryptedData = {
      ...encrypted,
      iv: Buffer.from(encrypted.iv),
    };
    tampered.iv[0] ^= 0xff;

    expect(() => decrypt(tampered, key)).toThrow();
  });

  it('should throw on invalid key length', () => {
    const encrypted = encrypt(Buffer.from('test'), key);
    expect(() => decrypt(encrypted, Buffer.alloc(16))).toThrow();
  });
});

describe('round-trip integrity', () => {
  it('should preserve data for various sizes', () => {
    const key = generateKey();
    const sizes = [1, 15, 16, 17, 255, 256, 1024, 65536];

    for (const size of sizes) {
      const plaintext = Buffer.alloc(size);
      for (let i = 0; i < size; i++) plaintext[i] = i % 256;

      const decrypted = decrypt(encrypt(plaintext, key), key);
      expect(decrypted.equals(plaintext)).toBe(true);
    }
  });

  it('should work with different keys for different data', () => {
    const key1 = generateKey();
    const key2 = generateKey();
    const data1 = Buffer.from('data for key 1');
    const data2 = Buffer.from('data for key 2');

    const enc1 = encrypt(data1, key1);
    const enc2 = encrypt(data2, key2);

    expect(decrypt(enc1, key1).equals(data1)).toBe(true);
    expect(decrypt(enc2, key2).equals(data2)).toBe(true);

    // Cross-key must fail
    expect(() => decrypt(enc1, key2)).toThrow();
    expect(() => decrypt(enc2, key1)).toThrow();
  });
});
