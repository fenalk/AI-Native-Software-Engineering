import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../users/user.js';

interface MaybeAuthenticatedRequest {
  user?: User;
}

/**
 * Injects the user resolved by `OptionalJwtAuthGuard`, or `null` for guests.
 * Unlike `CurrentUser`, it never throws.
 */
export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | null => {
    const { user } = ctx
      .switchToHttp()
      .getRequest<MaybeAuthenticatedRequest>();

    return user ?? null;
  },
);
