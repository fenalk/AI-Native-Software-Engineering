import { z } from 'zod';

/**
 * Fallback used only by development and tests. It is public on purpose: nothing
 * outside those environments may ever sign with it, which is why
 * `validateEnvironment` rejects it in production.
 */
export const DEVELOPMENT_JWT_SECRET = 'dev-only-insecure-secret';

/**
 * Shortest secret accepted in production; HS256 keys shorter than the hash
 * output are brute-forceable, so anything below 256 bits is refused.
 */
export const MIN_JWT_SECRET_LENGTH = 32;

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().optional(),
});

export type Environment = z.infer<typeof environmentSchema> & {
  JWT_SECRET: string;
};

/**
 * `ConfigModule.forRoot({ validate })` hook. It runs after `.env` is loaded and
 * before any provider is built, so secrets are checked once at boot instead of
 * being read at import time (where ESM resolves modules before `ConfigModule`).
 */
export function validateEnvironment(
  raw: Record<string, unknown>,
): Environment {
  const parsed = environmentSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${detail}`);
  }

  const environment = parsed.data;

  if (environment.NODE_ENV === 'production') {
    assertProductionSecret(environment.JWT_SECRET);
  }

  return {
    ...environment,
    JWT_SECRET: environment.JWT_SECRET ?? DEVELOPMENT_JWT_SECRET,
  };
}

function assertProductionSecret(secret: string | undefined): void {
  if (!secret) {
    throw new Error('JWT_SECRET is required when NODE_ENV=production.');
  }
  // Checked before the length rule so the public value always reports as such.
  if (secret === DEVELOPMENT_JWT_SECRET) {
    throw new Error('JWT_SECRET must not be the public development fallback.');
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`,
    );
  }
}

/** Small read-only view of `ConfigService`, so this module has no Nest import. */
export interface EnvironmentReader {
  get<T = unknown>(key: string): T | undefined;
  getOrThrow<T = unknown>(key: string): T;
}

/**
 * Reads the validated JWT secret. `validateEnvironment` already guarantees a
 * value and rejects weak ones in production, so a missing key here means the
 * module was wired around `ConfigModule` and is a programming error.
 */
export function readJwtSecret(config: EnvironmentReader): string {
  return config.getOrThrow<string>('JWT_SECRET');
}
