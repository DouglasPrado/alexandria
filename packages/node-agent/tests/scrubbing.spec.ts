import { resolve } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { LocalScrubbingService } from '../src/scrubbing';
import { LocalChunkStorage } from '../src/storage';

/**
 * Testes do LocalScrubbingService — verificacao local de integridade SHA-256.
 * Fonte: docs/blueprint/07-critical_flows.md (Scrubbing e Verificacao de Integridade)
 *
 * - Recalcula SHA-256 de cada chunk local
 * - Compara com chunkId (que e o SHA-256 original)
 * - Reporta chunks corrompidos
 */

const TEST_DIR = resolve(__dirname, '__fixtures__', 'scrub-chunks');

describe('LocalScrubbingService', () => {
  let storage: LocalChunkStorage;
  let scrubber: LocalScrubbingService;

  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    storage = new LocalChunkStorage(TEST_DIR);
    scrubber = new LocalScrubbingService(storage);
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should verify healthy chunks (hash matches chunkId)', async () => {
    const data = Buffer.from('valid-chunk-data');
    const chunkId = createHash('sha256').update(data).digest('hex');
    writeFileSync(resolve(TEST_DIR, chunkId), data);

    const result = await scrubber.scrubLocal();

    expect(result.verified).toBe(1);
    expect(result.corrupted).toBe(0);
  });

  it('should detect corrupted chunk (hash mismatch)', async () => {
    // chunkId says one thing, data says another
    const fakeChunkId = createHash('sha256').update(Buffer.from('original')).digest('hex');
    writeFileSync(resolve(TEST_DIR, fakeChunkId), Buffer.from('CORRUPTED'));

    const result = await scrubber.scrubLocal();

    expect(result.corrupted).toBe(1);
    expect(result.corruptedIds).toContain(fakeChunkId);
  });

  it('should handle mix of healthy and corrupted chunks', async () => {
    // Healthy
    const good = Buffer.from('good-data');
    const goodId = createHash('sha256').update(good).digest('hex');
    writeFileSync(resolve(TEST_DIR, goodId), good);

    // Corrupted
    const badId = createHash('sha256').update(Buffer.from('was-good')).digest('hex');
    writeFileSync(resolve(TEST_DIR, badId), Buffer.from('now-bad'));

    const result = await scrubber.scrubLocal();

    expect(result.verified).toBe(1);
    expect(result.corrupted).toBe(1);
  });

  it('should return empty result when no chunks stored', async () => {
    const result = await scrubber.scrubLocal();

    expect(result.verified).toBe(0);
    expect(result.corrupted).toBe(0);
    expect(result.corruptedIds).toEqual([]);
  });
});
