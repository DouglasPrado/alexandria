import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetQuotaDto } from './dto/set-quota.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMember, type CurrentMemberPayload } from '../../common/decorators/current-member.decorator';

@Controller()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  /** POST /api/clusters/:clusterId/invites — Gerar convite (JWT+admin, UC-002) */
  @Post('clusters/:clusterId/invites')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Param('clusterId') clusterId: string,
    @Body() dto: CreateInviteDto,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.memberService.invite(clusterId, member.memberId, dto);
  }

  /** POST /api/invites/:token/accept — Aceitar convite (publica, UC-002) */
  @Public()
  @Post('invites/:token/accept')
  @HttpCode(HttpStatus.CREATED)
  async acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto,
  ) {
    return this.memberService.acceptInvite(token, dto);
  }

  /** PATCH /api/members/me — Atualizar perfil do membro autenticado (JWT) */
  @Patch('members/me')
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentMember() member: CurrentMemberPayload,
  ) {
    return this.memberService.updateProfile(member.memberId, dto);
  }

  /** GET /api/clusters/:clusterId/members — Listar membros com cursor pagination (JWT) */
  @Get('clusters/:clusterId/members')
  async list(
    @Param('clusterId') clusterId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.memberService.listByCluster(clusterId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** PATCH /api/clusters/:clusterId/members/:memberId/quota — Definir quota (JWT+admin) */
  @Patch('clusters/:clusterId/members/:memberId/quota')
  @Roles('admin')
  async setQuota(
    @Param('clusterId') clusterId: string,
    @Param('memberId') memberId: string,
    @Body() dto: SetQuotaDto,
  ) {
    return this.memberService.setQuota(memberId, clusterId, dto.bytes);
  }

  /** DELETE /api/clusters/:clusterId/members/:memberId — Remover membro (JWT+admin) */
  @Delete('clusters/:clusterId/members/:memberId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('clusterId') clusterId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberService.remove(memberId, clusterId);
  }
}
