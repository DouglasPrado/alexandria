import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NodeService } from './node.service';
import { StorageService } from '../storage/storage.service';
import { RegisterNodeDto } from './dto/register-node.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMember, type CurrentMemberPayload } from '../../common/decorators/current-member.decorator';

@Controller('nodes')
export class NodeController {
  constructor(
    private readonly nodeService: NodeService,
    private readonly storageService: StorageService,
  ) {}

  /** POST /api/nodes — Registrar no (JWT+admin, UC-003) */
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterNodeDto,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.nodeService.register(member.clusterId, member.memberId, dto);
  }

  /** GET /api/nodes — Listar nos do cluster (JWT) */
  @Get()
  async list(@CurrentMember() member: CurrentMemberPayload) {
    return this.nodeService.listByCluster(member.clusterId);
  }

  /** GET /api/nodes/:id — Detalhe do nó (JWT) */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.nodeService.findById(id, member.clusterId);
  }

  /** POST /api/nodes/:id/heartbeat — Heartbeat do agente (publica para agentes) */
  @Public()
  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  async heartbeat(@Param('id') id: string) {
    return this.nodeService.heartbeat(id);
  }

  /** POST /api/nodes/:id/drain — Iniciar drain (JWT+admin, UC-006) */
  @Post(':id/drain')
  @Roles('admin')
  @HttpCode(HttpStatus.ACCEPTED)
  async drain(@Param('id') id: string) {
    return this.nodeService.drain(id);
  }

  /** DELETE /api/nodes/:id — Remover no apos drain (JWT+admin) */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.nodeService.remove(id);
  }

  /** POST /api/nodes/rebalance — Rebalancear chunks entre nos (JWT+admin) */
  @Post('rebalance')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async rebalance() {
    return this.storageService.rebalance();
  }
}
