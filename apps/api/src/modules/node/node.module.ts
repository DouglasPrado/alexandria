import { Module } from '@nestjs/common';
import { NodeService } from './node.service';
import { NodeController } from './node.controller';
import { NodeRepository } from './node.repository';

@Module({
  controllers: [NodeController],
  providers: [NodeService, NodeRepository],
  exports: [NodeService, NodeRepository],
})
export class NodeModule {}
