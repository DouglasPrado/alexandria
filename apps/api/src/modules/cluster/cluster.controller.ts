import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ClusterService } from './cluster.service';
import { RecoveryService } from './recovery.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { RecoverClusterDto } from './dto/recover-cluster.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('clusters')
export class ClusterController {
  constructor(
    private readonly clusterService: ClusterService,
    private readonly recoveryService: RecoveryService,
  ) {}

  /** POST /api/clusters — Criar cluster familiar (UC-001, publica) */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClusterDto) {
    return this.clusterService.create(dto);
  }

  /** GET /api/clusters/:id — Obter detalhes do cluster (JWT) */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.clusterService.findById(id);
  }

  /** POST /api/clusters/recovery — Recovery via seed phrase (UC-007, publica) */
  @Public()
  @Post('recovery')
  @HttpCode(HttpStatus.OK)
  async recover(@Body() dto: RecoverClusterDto) {
    return this.recoveryService.recover(dto);
  }
}
