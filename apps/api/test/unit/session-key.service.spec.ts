import { SessionKeyService } from '../../src/common/services/session-key.service';

/**
 * Testes do SessionKeyService — cache in-memory de masterKey + adminPassword.
 * Fonte: docs/blueprint/13-security.md (zero-knowledge)
 *
 * - Zero-knowledge: masterKey só existe em memória, nunca persiste
 * - TTL: chaves expiram após 30 minutos
 * - Usado por NodeService (vault sync) e StorageService (token refresh vault sync)
 */
describe('SessionKeyService', () => {
  let service: SessionKeyService;

  beforeEach(() => {
    service = new SessionKeyService();
  });

  describe('store() + get()', () => {
    it('should store and retrieve master key', () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      service.store('member-1', masterKey, 'admin-password');

      const result = service.get('member-1');
      expect(result).not.toBeNull();
      expect(result!.masterKey).toEqual(masterKey);
    });

    it('should store and retrieve admin password', () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      service.store('member-1', masterKey, 'admin-password');

      const result = service.get('member-1');
      expect(result).not.toBeNull();
      expect(result!.adminPassword).toBe('admin-password');
    });

    it('should return null for unknown memberId', () => {
      const result = service.get('unknown-member');
      expect(result).toBeNull();
    });

    it('should return null for expired key', () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      service.store('member-1', masterKey, 'admin-password');

      // Simulate expiration by manipulating the internal state
      const keys = (service as any).keys as Map<string, any>;
      const entry = keys.get('member-1')!;
      entry.expiresAt = Date.now() - 1000; // expired 1 second ago

      const result = service.get('member-1');
      expect(result).toBeNull();
    });

    it('should remove expired entry on get', () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      service.store('member-1', masterKey, 'admin-password');

      const keys = (service as any).keys as Map<string, any>;
      const entry = keys.get('member-1')!;
      entry.expiresAt = Date.now() - 1000;

      service.get('member-1');
      expect(keys.has('member-1')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear stored key', () => {
      const masterKey = Buffer.from('a'.repeat(64), 'hex');
      service.store('member-1', masterKey, 'admin-password');

      service.clear('member-1');

      const result = service.get('member-1');
      expect(result).toBeNull();
    });

    it('should not throw when clearing unknown memberId', () => {
      expect(() => service.clear('unknown')).not.toThrow();
    });
  });

  describe('overwrite behavior', () => {
    it('should overwrite existing key for same memberId', () => {
      const key1 = Buffer.from('a'.repeat(64), 'hex');
      const key2 = Buffer.from('b'.repeat(64), 'hex');

      service.store('member-1', key1, 'password-1');
      service.store('member-1', key2, 'password-2');

      const result = service.get('member-1');
      expect(result!.masterKey).toEqual(key2);
      expect(result!.adminPassword).toBe('password-2');
    });
  });
});
