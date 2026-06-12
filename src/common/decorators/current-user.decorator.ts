import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtRequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtRequestUser }>();
    return request.user;
  },
);
