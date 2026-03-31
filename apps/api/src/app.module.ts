import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClusterModule } from './modules/cluster/cluster.module';
import { MemberModule } from './modules/member/member.module';
import { NodeModule } from './modules/node/node.module';
import { FileModule } from './modules/file/file.module';
import { HealthModule } from './modules/health/health.module';
import { StorageModule } from './modules/storage/storage.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventService } from './common/events';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ClusterMemberGuard } from './common/guards/cluster-member.guard';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.seedPhrase',
          ],
          censor: '[REDACTED]',
        },
        serializers: {
          req(req: Record<string, unknown>) {
            return {
              id: req['id'],
              method: req['method'],
              url: req['url'],
              remoteAddress: req['remoteAddress'],
            };
          },
        },
      },
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: process.env.NODE_ENV === 'production' ? 100 : 1000 },
      { name: 'upload', ttl: 60000, limit: process.env.NODE_ENV === 'production' ? 10 : 100 },
      { name: 'recovery', ttl: 3600000, limit: 3 },
    ]),
    CommonModule,
    PrismaModule,
    AuthModule,
    ClusterModule,
    MemberModule,
    NodeModule,
    FileModule,
    StorageModule,
    HealthModule,
  ],
  providers: [
    // Domain events
    DomainEventService,
    // Global guards: JWT auth + RBAC roles + cluster membership
    // Rate limit only in production to avoid dev friction
    ...(process.env.NODE_ENV === 'production'
      ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
      : []),
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ClusterMemberGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
