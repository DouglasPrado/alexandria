import { Test } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventService } from '../../src/common/events/domain-event.service';

/**
 * Testes do DomainEventService — helper para emitir domain events.
 * Fonte: docs/backend/12-events.md (mapa de eventos, envelope padrao)
 *
 * - emit() adiciona envelope: eventId (UUID), timestamp, source
 * - Eventos propagados via EventEmitter2
 */

describe('DomainEventService', () => {
  let eventService: DomainEventService;
  let emitter: EventEmitter2;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [DomainEventService],
    }).compile();

    eventService = module.get(DomainEventService);
    emitter = module.get(EventEmitter2);
  });

  it('should emit event via EventEmitter2 with correct type', (done) => {
    emitter.on('ClusterCreated', (payload: any) => {
      expect(payload.type).toBe('ClusterCreated');
      expect(payload.clusterId).toBe('cluster-1');
      done();
    });

    eventService.emit({
      type: 'ClusterCreated',
      clusterId: 'cluster-1',
      adminMemberId: 'admin-1',
      timestamp: new Date(),
    });
  });

  it('should add eventId (UUID) to the envelope', (done) => {
    emitter.on('NodeRegistered', (payload: any) => {
      expect(payload.eventId).toBeDefined();
      expect(payload.eventId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      done();
    });

    eventService.emit({
      type: 'NodeRegistered',
      clusterId: 'c1',
      nodeId: 'n1',
      nodeType: 'local',
      timestamp: new Date(),
    });
  });

  it('should add source field to the envelope', (done) => {
    emitter.on('FileUploaded', (payload: any) => {
      expect(payload.source).toBe('alexandria-api');
      done();
    });

    eventService.emit({
      type: 'FileUploaded',
      clusterId: 'c1',
      fileId: 'f1',
      memberId: 'm1',
      mediaType: 'photo',
      originalSize: 1024,
      timestamp: new Date(),
    });
  });

  it('should emit multiple different event types', () => {
    const received: string[] = [];
    emitter.on('MemberJoined', () => received.push('MemberJoined'));
    emitter.on('MemberRemoved', () => received.push('MemberRemoved'));

    eventService.emit({
      type: 'MemberJoined',
      clusterId: 'c1',
      memberId: 'm1',
      role: 'member',
      timestamp: new Date(),
    });
    eventService.emit({
      type: 'MemberRemoved',
      clusterId: 'c1',
      memberId: 'm1',
      timestamp: new Date(),
    });

    expect(received).toEqual(['MemberJoined', 'MemberRemoved']);
  });
});
