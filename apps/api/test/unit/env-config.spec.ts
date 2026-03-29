import { validateEnv } from '../../src/config/env';

/**
 * Testes de validacao de env.
 * Fonte: docs/backend/02-project-structure.md (config/env.ts)
 */

describe('validateEnv()', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return default config in development', () => {
    process.env.NODE_ENV = 'development';
    const config = validateEnv();
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3333);
    expect(config.REDIS_HOST).toBe('localhost');
  });

  it('should throw in production if DATABASE_URL is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = '';
    process.env.JWT_SECRET = 'secret';
    process.env.RESEND_API_KEY = 'key';

    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });

  it('should throw in production if JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://...';
    process.env.JWT_SECRET = '';
    process.env.RESEND_API_KEY = 'key';

    expect(() => validateEnv()).toThrow(/JWT_SECRET/);
  });

  it('should pass in production with all required vars', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://...';
    process.env.JWT_SECRET = 'secret';
    process.env.RESEND_API_KEY = 'key';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should parse PORT as integer', () => {
    process.env.PORT = '4000';
    const config = validateEnv();
    expect(config.PORT).toBe(4000);
  });
});
