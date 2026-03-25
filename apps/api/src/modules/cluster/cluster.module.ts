import { Module } from '@nestjs/common';
import { ClusterService } from './cluster.service';
import { RecoveryService } from './recovery.service';
import { ClusterController } from './cluster.controller';

@Module({
  controllers: [ClusterController],
  providers: [ClusterService, RecoveryService],
  exports: [ClusterService, RecoveryService],
})
export class ClusterModule {}
