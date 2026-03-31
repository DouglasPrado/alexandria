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
  Res,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Response } from 'express';
import { NodeService } from './node.service';
import { StorageService } from '../storage/storage.service';
import { RegisterNodeDto } from './dto/register-node.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { NodeTokenGuard } from '../../common/guards/node-token.guard';
import {
  CurrentMember,
  type CurrentMemberPayload,
} from '../../common/decorators/current-member.decorator';
import { NodeOAuthService } from './node-oauth.service';
import { SessionKeyService } from '../../common/services/session-key.service';

@Controller('nodes')
export class NodeController {
  constructor(
    private readonly nodeService: NodeService,
    private readonly storageService: StorageService,
    private readonly nodeOAuthService: NodeOAuthService,
    private readonly sessionKeyService: SessionKeyService,
  ) {}

  @Get('oauth/:provider/start')
  @Roles('admin')
  async startOAuth(
    @Param('provider') provider: string,
    @Query('name') nodeName: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.nodeOAuthService.beginAuthorization({
      provider: provider as 'google_drive' | 'onedrive' | 'dropbox',
      memberId: member.memberId,
      clusterId: member.clusterId,
      nodeName,
    });
  }

  @Public()
  @Get('oauth/:provider/callback')
  async oauthCallback(
    @Param('provider') _provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const result = await this.nodeOAuthService.completeAuthorization({ code, state });
      response
        .type('html')
        .send(this.renderOAuthCallbackPage({ status: 'success', payload: result }));
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth node authorization failed';
      response
        .status(HttpStatus.BAD_REQUEST)
        .type('html')
        .send(this.renderOAuthCallbackPage({ status: 'error', payload: { message } }));
      return;
    }
  }

  /** POST /api/nodes — Registrar no (JWT+admin, UC-003) */
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterNodeDto, @CurrentMember() member: CurrentMemberPayload) {
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

  /** POST /api/nodes/vault-sync — Sincronizar nodeConfigs no vault do admin (JWT+admin) */
  @Post('vault-sync')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async vaultSync(
    @Body('adminPassword') adminPassword: string,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    const sessionData = this.sessionKeyService.get(member.memberId);
    if (!sessionData) {
      throw new UnprocessableEntityException(
        'Session key not cached. Please re-enter your seed phrase.',
      );
    }

    const nodeConfigs = await this.nodeService.getDecryptedNodeConfigs(member.clusterId);

    await this.storageService.syncAllNodeConfigsToVault(
      member.memberId,
      adminPassword || sessionData.adminPassword,
      sessionData.masterKey,
      nodeConfigs,
    );

    return { status: 'synced', nodeConfigsCount: nodeConfigs.length };
  }

  /** POST /api/nodes/rebalance — Rebalancear chunks entre nos (JWT+admin) */
  @Post('rebalance')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async rebalance() {
    return this.storageService.rebalance();
  }

  private renderOAuthCallbackPage(result: { status: 'success' | 'error'; payload: unknown }) {
    const targetOrigin = process.env.WEB_CLIENT_URL ?? 'http://localhost:3000';
    const serialized = JSON.stringify(result).replace(/</g, '\\u003c');

    return `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        var message = ${serialized};
        if (window.opener) {
          window.opener.postMessage({ type: 'alexandria:oauth-node', ...message }, '${targetOrigin}');
        }
        window.close();
      })();
    </script>
  </body>
</html>`;
  }
}
