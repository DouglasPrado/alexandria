import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HealthService } from './health.service';

/**
 * SchedulerService — tarefas periodicas via @nestjs/schedule.
 * Fonte: docs/blueprint/06-system-architecture.md (Scheduler)
 *
 * - Heartbeat check: a cada 5 minutos
 * - Scrubbing, GC: stubs para proximas iteracoes
 */
@Injectable()
export class SchedulerService {
  constructor(private readonly healthService: HealthService) {}

  /** Verifica heartbeats a cada 5 minutos e dispara auto-healing para nos lost */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleHeartbeatCheck() {
    const result = await this.healthService.checkHeartbeats();
    if (result.suspect > 0 || result.lost > 0) {
      console.warn(
        `[Scheduler] Heartbeat check: ${result.suspect} suspect, ${result.lost} lost`,
      );
    }

    // Auto-healing: re-replicar chunks de nos que acabaram de ficar lost
    for (const node of result.lostNodes) {
      try {
        console.log(`[Scheduler] Starting auto-healing for node ${node.id} (${node.name})`);
        const healResult = await this.healthService.autoHeal(node.id, node.clusterId);
        console.log(
          `[Scheduler] Auto-healing for ${node.name}: ${healResult.chunksHealed} healed, ${healResult.chunksSkipped} skipped, ${healResult.chunksFailed} failed`,
        );
      } catch (err) {
        console.error(
          `[Scheduler] Auto-healing failed for node ${node.id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  /** Scrubbing diario as 03:00 — verifica integridade de chunks via SHA-256 (RN-CR3) */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleScrubbing() {
    console.log('[Scheduler] Starting scrubbing cycle (batch: 1000)');
    try {
      const result = await this.healthService.scrub(1000);
      console.log(
        `[Scheduler] Scrubbing complete: ${result.verified} verified, ${result.corrupted} corrupted, ${result.repaired} repaired, ${result.skipped} skipped, ${result.irrecoverable} irrecoverable`,
      );
    } catch (err) {
      console.error(
        '[Scheduler] Scrubbing failed:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  /** GC diario as 04:00 — remove chunks orfaos (referenceCount = 0) */
  @Cron('0 4 * * *')
  async handleGarbageCollect() {
    console.log('[Scheduler] Starting garbage collection');
    try {
      const result = await this.healthService.garbageCollect();
      if (result.chunksRemoved > 0) {
        console.log(
          `[Scheduler] GC complete: ${result.chunksRemoved} chunks removed, ${result.replicasRemoved} replicas cleaned, ${result.spaceFreed} bytes freed`,
        );
      }
    } catch (err) {
      console.error(
        '[Scheduler] Garbage collection failed:',
        err instanceof Error ? err.message : err,
      );
    }
  }
}
