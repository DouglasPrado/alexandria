import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Testes para verificar que rate limiting esta configurado.
 * Fonte: docs/backend/08-middlewares.md (pipeline step #4 — ThrottlerGuard)
 *
 * Verifica que:
 * - AppModule importa ThrottlerModule
 * - ThrottlerGuard registrado como APP_GUARD
 * - Multiplos scopes (ttl/limit)
 */

const appModuleSrc = readFileSync(
  resolve(__dirname, '../../src/app.module.ts'),
  'utf-8',
);

describe('Rate Limiting (ThrottlerGuard)', () => {
  it('should import ThrottlerModule in app.module.ts', () => {
    expect(appModuleSrc).toContain('ThrottlerModule');
  });

  it('should import ThrottlerGuard in app.module.ts', () => {
    expect(appModuleSrc).toContain('ThrottlerGuard');
  });

  it('should register ThrottlerGuard as APP_GUARD', () => {
    expect(appModuleSrc).toMatch(/provide:\s*APP_GUARD.*useClass:\s*ThrottlerGuard/s);
  });

  it('should configure ttl and limit for rate limiting', () => {
    expect(appModuleSrc).toMatch(/ttl/);
    expect(appModuleSrc).toMatch(/limit/);
  });
});
