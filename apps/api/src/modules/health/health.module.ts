import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { SchedulerService } from './scheduler.service';
import { AlertRepository } from './alert.repository';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationModule],
  controllers: [HealthController],
  providers: [HealthService, SchedulerService, AlertRepository],
  exports: [HealthService, AlertRepository],
})
export class HealthModule {}
