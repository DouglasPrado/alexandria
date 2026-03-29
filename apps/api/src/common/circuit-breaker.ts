/**
 * CircuitBreaker — protege chamadas a servicos externos.
 * Fonte: docs/backend/13-integrations.md (circuit breaker pattern)
 *
 * Estados: CLOSED (normal) → OPEN (falhas > threshold) → HALF_OPEN (teste)
 * - CLOSED: chamadas passam normalmente; falhas incrementam contador
 * - OPEN: chamadas rejeitadas imediatamente com erro
 * - HALF_OPEN: apos cooldown, permite 1 chamada de teste
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Nome do circuito (para logs) */
  name: string;
  /** Numero de falhas para abrir o circuito */
  failureThreshold: number;
  /** Janela de tempo para contar falhas (ms) */
  failureWindow: number;
  /** Tempo que o circuito fica aberto antes de testar (ms) */
  cooldownMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number[] = [];
  private openedAt = 0;

  constructor(private readonly opts: CircuitBreakerOptions) {}

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt >= this.opts.cooldownMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`CircuitBreaker [${this.opts.name}] is OPEN`);
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      return result;
    } catch (err) {
      this.recordFailure();
      if (this.state === 'HALF_OPEN') {
        this.trip();
      }
      throw err;
    }
  }

  private recordFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    // Remove falhas fora da janela
    this.failures = this.failures.filter((t) => now - t <= this.opts.failureWindow);

    if (this.failures.length >= this.opts.failureThreshold) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    this.failures = [];
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failures = [];
    this.openedAt = 0;
  }
}
