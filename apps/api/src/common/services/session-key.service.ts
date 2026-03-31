import { Injectable } from '@nestjs/common';

/**
 * SessionKeyService — cache in-memory de masterKey + adminPassword com TTL.
 *
 * Zero-knowledge compliant: masterKey só existe em memória de processo, nunca persiste.
 * Populado durante:
 *   - Criação do cluster (seed gerada → masterKey derivado)
 *   - Recovery (seed informada → masterKey derivado)
 *   - Unlock explícito via POST /api/session/unlock
 *
 * Usado por:
 *   - NodeService: persistir nodeConfigs no vault do admin ao registrar nó
 *   - StorageService: sync automático do vault em refresh de token OAuth
 */
@Injectable()
export class SessionKeyService {
  private readonly keys = new Map<
    string,
    { masterKey: Buffer; adminPassword: string; expiresAt: number }
  >();

  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutos

  store(memberId: string, masterKey: Buffer, adminPassword: string): void {
    this.keys.set(memberId, {
      masterKey,
      adminPassword,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  get(memberId: string): { masterKey: Buffer; adminPassword: string } | null {
    const entry = this.keys.get(memberId);
    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.keys.delete(memberId);
      return null;
    }

    return { masterKey: entry.masterKey, adminPassword: entry.adminPassword };
  }

  clear(memberId: string): void {
    this.keys.delete(memberId);
  }
}
