import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { MemberRepository } from './member.repository';
import { InviteRepository } from './invite.repository';
import { VaultRepository } from './vault.repository';
import { VaultService } from './vault.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: '24h' },
    }),
    NotificationModule,
  ],
  controllers: [MemberController],
  providers: [MemberService, MemberRepository, InviteRepository, VaultRepository, VaultService],
  exports: [MemberService, MemberRepository, InviteRepository, VaultRepository, VaultService],
})
export class MemberModule {}
