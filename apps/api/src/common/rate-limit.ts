import { Throttle, type ThrottlerModuleOptions } from '@nestjs/throttler';

const ONE_MINUTE_MS = 60_000;

/**
 * Global budget per client IP. Every route gets it through the `ThrottlerGuard`
 * registered in `AppModule`; the decorators below tighten specific routes.
 *
 * Storage is in memory, so the counters are per process. Behind a reverse
 * proxy, enable Express `trust proxy` or every client shares the proxy's IP.
 */
export const RATE_LIMIT_OPTIONS: ThrottlerModuleOptions = {
  throttlers: [{ name: 'default', ttl: ONE_MINUTE_MS, limit: 120 }],
  errorMessage: 'Too many requests, try again later.',
};

/** Sign-in and sign-up: slows down credential stuffing and account farming. */
export const AUTH_RATE_LIMIT = { limit: 5, ttl: ONE_MINUTE_MS };

/** Writes that create content (posts and comments). */
export const WRITE_RATE_LIMIT = { limit: 20, ttl: ONE_MINUTE_MS };

export const AuthRateLimit = () => Throttle({ default: AUTH_RATE_LIMIT });

export const WriteRateLimit = () => Throttle({ default: WRITE_RATE_LIMIT });
