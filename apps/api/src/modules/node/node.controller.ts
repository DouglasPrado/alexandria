import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { NodeService } from './node.service';
import { StorageService } from '../storage/storage.service';
import { RegisterNodeDto } from './dto/register-node.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { NodeTokenGuard } from '../../common/guards/node-token.guard';
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

  /** GET /api/nodes — Listar nos do cluster com cursor pagination (JWT) */
  @Get()
  async list(
    @CurrentMember() member: CurrentMemberPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.nodeService.listByCluster(member.clusterId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  /** GET /api/nodes/:id — Detalhe do nó (JWT) */
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.nodeService.findById(id, member.clusterId);
  }

  /** POST /api/nodes/:id/heartbeat — Heartbeat do agente (autenticado via node token) */
  @Public()
  @UseGuards(NodeTokenGuard)
  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  async heartbeat(@Param('id', ParseUUIDPipe) id: string) {
    return this.nodeService.heartbeat(id);
  }

  /** POST /api/nodes/:id/drain — Iniciar drain (JWT+admin, UC-006) */
  @Post(':id/drain')
  @Roles('admin')
  @HttpCode(HttpStatus.ACCEPTED)
  async drain(@Param('id', ParseUUIDPipe) id: string) {
    return this.nodeService.drain(id);
  }

  /** DELETE /api/nodes/:id — Remover no apos drain (JWT+admin) */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.nodeService.remove(id);
  }

  /** PATCH /api/nodes/:id/tier — Alterar tier do no (JWT+admin) */
  @Patch(':id/tier')
  @Roles('admin')
  async setTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('tier') tier: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.nodeService.setTier(id, member.clusterId, tier);
  }

  /** POST /api/nodes/rebalance — Rebalancear chunks entre nos (JWT+admin) */
  @Post('rebalance')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async rebalance() {
    return this.storageService.rebalance();
  }
}
