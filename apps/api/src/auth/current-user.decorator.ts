import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '../users/user.js';

interface AuthenticatedRequest {
  user?: User;
}

/** Injects the user that `JwtStrategy` validated for the current request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const { user } = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  },
);
