import { Module } from '@nestjs/common';
import { ClusterService } from './cluster.service';
import { RecoveryService } from './recovery.service';
import { ClusterController } from './cluster.controller';
import { ClusterRepository } from './cluster.repository';

@Module({
  controllers: [ClusterController],
  providers: [ClusterService, RecoveryService, ClusterRepository],
  exports: [ClusterService, RecoveryService, ClusterRepository],
})
export class ClusterModule {}
