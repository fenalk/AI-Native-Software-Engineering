import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '../users/user.js';

/**
 * Authenticates the request when a valid Bearer token is present and lets it
 * through as a guest otherwise. Used by read routes that enrich the response
 * for signed-in users (`likedByMe`) without requiring a session.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User | null>(
    _error: unknown,
    user: User | null,
  ): TUser {
    return (user ?? null) as TUser;
  }
}
