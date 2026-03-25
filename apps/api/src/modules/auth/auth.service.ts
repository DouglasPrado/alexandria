import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: { email: string; password: string }) {
    const member = await this.prisma.member.findFirst({
      where: { email: dto.email },
    });

    if (!member) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    const passwordValid = await argon2.verify(member.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    const payload = {
      sub: member.id,
      clusterId: member.clusterId,
      role: member.role,
    };

    return {
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        clusterId: member.clusterId,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async refresh(token: string) {
    let payload: { sub: string; clusterId: string; role: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: payload.sub },
    });

    if (!member) {
      throw new UnauthorizedException('Membro nao encontrado');
    }

    return {
      accessToken: this.jwtService.sign({
        sub: member.id,
        clusterId: member.clusterId,
        role: member.role,
      }),
    };
  }

  async validateMember(memberId: string) {
    return this.prisma.member.findFirst({
      where: { id: memberId },
    });
  }
}
