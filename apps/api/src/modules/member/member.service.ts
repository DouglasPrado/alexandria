import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  GoneException,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

const INVITE_EXPIRY_DAYS = 7;
const MAX_MEMBERS_PER_CLUSTER = 10;

/**
 * MemberService — convites, aceite, listagem, remocao.
 * Fonte: docs/backend/06-services.md (MemberService)
 */
@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Gera convite com token e expiracao 7 dias (RN-I1).
   * Somente admin pode chamar (RN-I4 — enforced pelo RolesGuard).
   */
  async invite(clusterId: string, createdBy: string, dto: { email: string; role: string }) {
    // RN-M1: Email unico dentro do cluster
    const existingMember = await this.prisma.member.findFirst({
      where: { clusterId, email: dto.email },
    });
    if (existingMember) {
      throw new ConflictException('Membro ja existe neste cluster');
    }

    // Check pending invite for same email
    const pendingInvite = await this.prisma.invite.findFirst({
      where: { clusterId, email: dto.email, acceptedAt: null },
    });
    if (pendingInvite) {
      throw new ConflictException('Convite pendente para este email');
    }

    // RN-C3: Max 10 membros
    const memberCount = await this.prisma.member.count({ where: { clusterId } });
    if (memberCount >= MAX_MEMBERS_PER_CLUSTER) {
      throw new UnprocessableEntityException('Cluster atingiu o limite de 10 membros');
    }

    // Generate token (RN-I1)
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const [invite, cluster, inviter] = await Promise.all([
      this.prisma.invite.create({
        data: { clusterId, email: dto.email, role: dto.role, token, expiresAt, createdBy },
      }),
      this.prisma.cluster.findUnique({ where: { id: clusterId } }),
      this.prisma.member.findUnique({ where: { id: createdBy } }),
    ]);

    // Dispara email de convite (fire-and-forget, graceful degradation)
    this.notifications.sendInviteEmail({
      to: dto.email,
      name: dto.email.split('@')[0] ?? dto.email,
      inviterName: inviter?.name ?? 'Alexandria',
      clusterName: cluster?.name ?? 'Cluster',
      inviteToken: token,
    }).catch(() => {});

    return {
      id: invite.id,
      token: invite.token,
      inviteUrl: `/invites/${invite.token}/accept`,
      expiresAt: invite.expiresAt.toISOString(),
      role: invite.role,
    };
  }

  /**
   * Aceita convite, cria membro + vault (RN-I2, RN-M4).
   * Conforme backend/06-services.md — acceptInvite fluxo detalhado (16 passos).
   */
  async acceptInvite(token: string, dto: { name: string; password: string }) {
    // 2-3. Find invite by token
    const invite = await this.prisma.invite.findFirst({
      where: { token },
    });
    if (!invite) {
      throw new NotFoundException('Convite nao encontrado');
    }

    // 4. Check expiration (RN-I1)
    if (invite.expiresAt < new Date()) {
      throw new GoneException('Convite expirado');
    }

    // 5. Check if already accepted (RN-I2)
    if (invite.acceptedAt) {
      throw new ConflictException('Convite ja foi aceito');
    }

    // 6-7. Check if member already exists (RN-M1)
    const existingMember = await this.prisma.member.findFirst({
      where: { clusterId: invite.clusterId, email: invite.email },
    });
    if (existingMember) {
      throw new ConflictException('Membro ja existe neste cluster');
    }

    // 8. Check member limit (RN-C3)
    const memberCount = await this.prisma.member.count({
      where: { clusterId: invite.clusterId },
    });
    if (memberCount >= MAX_MEMBERS_PER_CLUSTER) {
      throw new UnprocessableEntityException('Cluster atingiu o limite de 10 membros');
    }

    // Hash password
    const passwordHash = await argon2.hash(dto.password);

    // 9-13. Transaction: create member + vault + mark invite accepted
    const member = await this.prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          clusterId: invite.clusterId,
          name: dto.name,
          email: invite.email,
          passwordHash,
          role: invite.role,
          invitedBy: invite.createdBy,
        },
      });

      await tx.vault.create({
        data: {
          memberId: newMember.id,
          vaultData: new Uint8Array(Buffer.from('{}')) as Uint8Array<ArrayBuffer>,
          encryptionAlgorithm: 'AES-256-GCM',
          replicatedTo: [],
          isAdminVault: false,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return newMember;
    });

    // 14. Sign JWT for new member
    const accessToken = this.jwtService.sign({
      sub: member.id,
      clusterId: member.clusterId,
      role: member.role,
    });

    // Dispara email de boas-vindas (fire-and-forget)
    (async () => {
      const c = await this.prisma.cluster.findUnique({ where: { id: member.clusterId } });
      await this.notifications.sendWelcomeEmail({
        to: member.email,
        name: member.name,
        clusterName: c?.name ?? 'Cluster',
        role: member.role,
      });
    })().catch(() => {});

    return {
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        clusterId: member.clusterId,
        joinedAt: member.joinedAt.toISOString(),
      },
      accessToken,
    };
  }

  /** Lista membros de um cluster */
  async listByCluster(clusterId: string, opts?: { cursor?: string; limit?: number }) {
    const limit = opts?.limit ?? 20;
    const query: any = {
      where: { clusterId },
      orderBy: { joinedAt: 'asc' },
      take: limit + 1,
    };
    if (opts?.cursor) {
      query.cursor = { id: opts.cursor };
      query.skip = 1;
    }

    const members = await this.prisma.member.findMany(query);
    const hasMore = members.length > limit;
    const data = (hasMore ? members.slice(0, limit) : members).map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      clusterId: m.clusterId,
      joinedAt: m.joinedAt.toISOString(),
    }));

    return {
      data,
      meta: {
        cursor: data.length > 0 ? data[data.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  /**
   * Define ou remove quota de armazenamento de um membro (admin-only, enforced no controller).
   * bytes = undefined → remove quota (NULL = ilimitado).
   */
  async setQuota(memberId: string, clusterId: string, bytes: number | undefined) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, clusterId } });
    if (!member) throw new NotFoundException('Membro nao encontrado');

    return this.prisma.member.update({
      where: { id: memberId },
      data: { storageQuotaBytes: bytes != null ? BigInt(bytes) : null },
    });
  }

  /**
   * Atualiza nome e/ou senha do membro autenticado.
   */
  async updateProfile(memberId: string, dto: { name?: string; currentPassword?: string; newPassword?: string }) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Membro nao encontrado');
    }

    const data: Record<string, unknown> = {};

    if (dto.name) {
      data.name = dto.name;
    }

    if (dto.newPassword) {
      const valid = await argon2.verify(member.passwordHash, dto.currentPassword ?? '');
      if (!valid) {
        throw new UnauthorizedException('Senha atual incorreta');
      }
      data.passwordHash = await argon2.hash(dto.newPassword);
    }

    const updated = await this.prisma.member.update({ where: { id: memberId }, data });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      clusterId: updated.clusterId,
    };
  }

  /**
   * Remove membro do cluster.
   * RN-M2: Nao pode remover o ultimo admin.
   */
  async remove(memberId: string, clusterId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, clusterId },
    });
    if (!member) {
      throw new NotFoundException('Membro nao encontrado');
    }

    // RN-M2: Cannot remove last admin
    if (member.role === 'admin') {
      const adminCount = await this.prisma.member.count({
        where: { clusterId, role: 'admin' },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Nao e possivel remover o unico admin do cluster');
      }
    }

    await this.prisma.member.delete({ where: { id: memberId } });
  }
}
