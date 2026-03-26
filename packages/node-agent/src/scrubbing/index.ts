import { createHash } from 'node:crypto';
import { LocalChunkStorage } from '../storage';

export interface LocalScrubResult {
  verified: number;
  corrupted: number;
  corruptedIds: string[];
}

/**
 * LocalScrubbingService — verificacao local de integridade via SHA-256.
 * Fonte: docs/blueprint/07-critical_flows.md (Scrubbing e Verificacao de Integridade)
 *
 * Para cada chunk local:
 * 1. Le os dados do filesystem
 * 2. Recalcula SHA-256
 * 3. Compara com chunkId (que e o hash original)
 * 4. Reporta corrompidos
 */
export class LocalScrubbingService {
  constructor(private readonly storage: LocalChunkStorage) {}

  /** Verifica integridade de todos os chunks locais */
  async scrubLocal(): Promise<LocalScrubResult> {
    const chunkIds = await this.storage.list();
    let verified = 0;
    let corrupted = 0;
    const corruptedIds: string[] = [];

    for (const chunkId of chunkIds) {
      try {
        const data = await this.storage.get(chunkId);
        const computedHash = createHash('sha256').update(data).digest('hex');

        if (computedHash === chunkId) {
          verified++;
        } else {
          corrupted++;
          corruptedIds.push(chunkId);
        }
      } catch {
        corrupted++;
        corruptedIds.push(chunkId);
      }
    }

    return { verified, corrupted, corruptedIds };
  }
}
