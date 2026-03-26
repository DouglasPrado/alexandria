import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
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
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
