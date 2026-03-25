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

  /** Verifica heartbeats a cada 5 minutos */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleHeartbeatCheck() {
    const result = await this.healthService.checkHeartbeats();
    if (result.suspect > 0 || result.lost > 0) {
      console.warn(
        `[Scheduler] Heartbeat check: ${result.suspect} suspect, ${result.lost} lost`,
      );
    }
  }

  // TODO: Scrubbing periodico — verificar integridade de chunks via SHA-256
  // @Cron(CronExpression.EVERY_DAY_AT_3AM)
  // async handleScrubbing() { ... }

  // TODO: Garbage collection — remover chunks orfaos
  // @Cron(CronExpression.EVERY_DAY_AT_4AM)
  // async handleGarbageCollect() { ... }
}
