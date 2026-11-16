import {
  HttpException,
  HttpStatus,
  type ExecutionContext,
} from '@nestjs/common';
import {
  Throttle,
  ThrottlerGuard,
  type ThrottlerLimitDetail,
} from '@nestjs/throttler';

/** Register name of the only throttler configured in `AppModule`. */
const THROTTLER_NAME = 'default';

/** Global ceiling: every route, signed in or not, is capped per client. */
export const GLOBAL_RATE_LIMIT = { ttl: 60_000, limit: 120 };

/**
 * Sign-in and sign-up are expensive (one `scrypt` per request) and the target
 * of credential stuffing, so the window is much tighter than the global one.
 */
export const AuthRateLimit = () =>
  Throttle({ [THROTTLER_NAME]: { ttl: 60_000, limit: 10 } });

/** Creating content costs a transaction and a body up to 100 KB. */
export const WriteRateLimit = () =>
  Throttle({ [THROTTLER_NAME]: { ttl: 60_000, limit: 30 } });

interface ResponseWithHeaders {
  setHeader(name: string, value: number): void;
}

/**
 * `ThrottlerGuard` that answers with the project's RFC 9457 error and a
 * `Retry-After` header, instead of the package's default body.
 */
export class RateLimitGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const retryAfterSeconds = Math.max(1, Math.ceil(detail.timeToBlockExpire));

    context
      .switchToHttp()
      .getResponse<ResponseWithHeaders>()
      .setHeader('Retry-After', retryAfterSeconds);

    throw new HttpException(
      { message: `Too many requests. Retry in ${retryAfterSeconds}s.` },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
