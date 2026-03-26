import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMember, type CurrentMemberPayload } from '../../common/decorators/current-member.decorator';

@Controller()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  /** POST /api/clusters/:id/invites — Gerar convite (JWT+admin, UC-002) */
  @Post('clusters/:id/invites')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Param('id') clusterId: string,
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

  /** GET /api/clusters/:id/members — Listar membros (JWT) */
  @Get('clusters/:id/members')
  async list(@Param('id') clusterId: string) {
    return this.memberService.listByCluster(clusterId);
  }

  /** DELETE /api/clusters/:id/members/:memberId — Remover membro (JWT+admin) */
  @Delete('clusters/:id/members/:memberId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') clusterId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberService.remove(memberId, clusterId);
  }
}
