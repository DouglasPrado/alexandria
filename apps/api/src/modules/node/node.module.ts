import { Module } from '@nestjs/common';
import { NodeService } from './node.service';
import { NodeController } from './node.controller';
import { NodeRepository } from './node.repository';
import { NodeOAuthService } from './node-oauth.service';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [MemberModule],
  controllers: [NodeController],
  providers: [NodeService, NodeRepository, NodeOAuthService],
  exports: [NodeService, NodeRepository, NodeOAuthService],
})
export class NodeModule {}
