import { CircuitBreaker } from '../../src/common/circuit-breaker';

/**
 * Testes do CircuitBreaker.
 * Fonte: docs/backend/13-integrations.md (circuit breaker pattern)
 */

describe('CircuitBreaker', () => {
  it('should start in CLOSED state', () => {
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 3,
      failureWindow: 60000,
      cooldownMs: 30000,
    });
    expect(cb.getState()).toBe('CLOSED');
  });

  it('should pass through calls when CLOSED', async () => {
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 3,
      failureWindow: 60000,
      cooldownMs: 30000,
    });

    const result = await cb.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('should open after failureThreshold failures', async () => {
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 3,
      failureWindow: 60000,
      cooldownMs: 30000,
    });

    const fail = () => cb.execute(() => Promise.reject(new Error('fail')));

    await expect(fail()).rejects.toThrow('fail');
    await expect(fail()).rejects.toThrow('fail');
    await expect(fail()).rejects.toThrow('fail');

    expect(cb.getState()).toBe('OPEN');
  });

  it('should reject immediately when OPEN', async () => {
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 1,
      failureWindow: 60000,
      cooldownMs: 30000,
    });

    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');

    await expect(cb.execute(() => Promise.resolve('ok'))).rejects.toThrow('OPEN');
  });

  it('should transition to HALF_OPEN after cooldown', async () => {
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 1,
      failureWindow: 60000,
      cooldownMs: 10, // 10ms for test speed
    });

    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');

    await new Promise((r) => setTimeout(r, 15));

    const result = await cb.execute(() => Promise.resolve('recovered'));
    expect(result).toBe('recovered');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('should re-open if HALF_OPEN test fails', async () => {
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 1,
      failureWindow: 60000,
      cooldownMs: 10,
    });

    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 15));

    await expect(cb.execute(() => Promise.reject(new Error('still failing')))).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');
  });
});
