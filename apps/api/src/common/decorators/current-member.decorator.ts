import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentMemberPayload {
  memberId: string;
  clusterId: string;
  role: string;
}

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentMemberPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
