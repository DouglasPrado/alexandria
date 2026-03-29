import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMember, type CurrentMemberPayload } from '../../common/decorators/current-member.decorator';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** GET /health/live — Liveness probe (publica) */
  @Public()
  @Get('health/live')
  live() {
    return this.healthService.live();
  }

  /** GET /health/ready — Readiness probe (publica) */
  @Public()
  @Get('health/ready')
  async ready() {
    return this.healthService.ready();
  }

  /** GET /api/alerts — Listar alertas do cluster (JWT+admin, UC-008) */
  @Get('alerts')
  @Roles('admin')
  async listAlerts(
    @CurrentMember() member: CurrentMemberPayload,
    @Query('resolved') resolved?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.healthService.listAlerts(member.clusterId, {
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** PATCH /api/alerts/:id/resolve — Resolver alerta (JWT+admin) */
  @Patch('alerts/:id/resolve')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async resolveAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.healthService.resolveAlert(id);
  }

  /** GET /health/metrics — Metricas operacionais JSON (publica) */
  @Public()
  @Get('health/metrics')
  async metrics() {
    return this.healthService.getMetrics();
  }
}
