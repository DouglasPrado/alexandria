import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
/** Minimal shape expected by the event service — full types in src/contracts/events */
interface DomainEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * DomainEventService — helper para emitir domain events com envelope padrao.
 * Fonte: docs/backend/12-events.md (envelope: eventId, version, timestamp, source)
 *
 * Uso: this.events.emit({ type: 'ClusterCreated', ... })
 * O EventEmitter2 propaga para @OnEvent() handlers.
 */
@Injectable()
export class DomainEventService {
  constructor(private readonly emitter: EventEmitter2) {}

  emit(event: DomainEvent): void {
    const envelope = {
      ...event,
      eventId: randomUUID(),
      version: '1.0',
      source: 'alexandria-api',
    };
    this.emitter.emit(event.type, envelope);
  }
}
