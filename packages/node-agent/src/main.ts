import { HeartbeatService } from './heartbeat';
import { LocalChunkStorage } from './storage';
import { LocalScrubbingService } from './scrubbing';

/**
 * Alexandria Node Agent — processo que roda em cada dispositivo local.
 * Fonte: docs/blueprint/06-system-architecture.md (Agente de No)
 *
 * Responsabilidades:
 * - Armazena chunks no filesystem local
 * - Envia heartbeats periodicos ao orquestrador (1/min)
 * - Executa scrubbing local (verificacao SHA-256)
 *
 * Config via env vars:
 * - NODE_ID: UUID do no registrado no orquestrador
 * - ORCHESTRATOR_URL: URL base do orquestrador (ex: http://localhost:3333)
 * - STORAGE_PATH: caminho local para armazenar chunks (default: ./data/chunks)
 * - HEARTBEAT_INTERVAL_MS: intervalo de heartbeat em ms (default: 60000)
 * - SCRUB_INTERVAL_MS: intervalo de scrubbing em ms (default: 86400000 = 24h)
 */

const NODE_ID = process.env.NODE_ID || '';
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3333';
const STORAGE_PATH = process.env.STORAGE_PATH || './data/chunks';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '60000', 10);
const SCRUB_INTERVAL = parseInt(process.env.SCRUB_INTERVAL_MS || '86400000', 10);

async function bootstrap() {
  if (!NODE_ID) {
    console.error('[NodeAgent] NODE_ID env var is required. Register this node in the orchestrator first.');
    process.exit(1);
  }

  console.log(`[NodeAgent] Starting node-agent for ${NODE_ID}`);
  console.log(`[NodeAgent] Orchestrator: ${ORCHESTRATOR_URL}`);
  console.log(`[NodeAgent] Storage path: ${STORAGE_PATH}`);

  const storage = new LocalChunkStorage(STORAGE_PATH);
  await storage.ensureDir();

  const heartbeat = new HeartbeatService(NODE_ID, ORCHESTRATOR_URL);
  const scrubber = new LocalScrubbingService(storage);

  // Heartbeat: 1/min
  await heartbeat.sendHeartbeat();
  setInterval(() => heartbeat.sendHeartbeat(), HEARTBEAT_INTERVAL);
  console.log(`[NodeAgent] Heartbeat started (every ${HEARTBEAT_INTERVAL / 1000}s)`);

  // Scrubbing: 1/day
  const runScrub = async () => {
    console.log('[NodeAgent] Starting local scrubbing...');
    const result = await scrubber.scrubLocal();
    console.log(
      `[NodeAgent] Scrubbing complete: ${result.verified} verified, ${result.corrupted} corrupted`,
    );
    if (result.corruptedIds.length > 0) {
      console.warn('[NodeAgent] Corrupted chunks:', result.corruptedIds);
    }
  };

  await runScrub();
  setInterval(runScrub, SCRUB_INTERVAL);
  console.log(`[NodeAgent] Scrubbing scheduled (every ${SCRUB_INTERVAL / 1000 / 3600}h)`);

  console.log('[NodeAgent] Ready.');
}

bootstrap().catch((err) => {
  console.error('[NodeAgent] Fatal error:', err);
  process.exit(1);
});
