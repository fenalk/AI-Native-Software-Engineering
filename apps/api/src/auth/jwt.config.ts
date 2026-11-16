import { z } from 'zod';

/**
 * Fallback secret for local development and tests only. It is public (it lives
 * in this file), so `validateEnvironment` refuses it anywhere else.
 */
export const DEV_JWT_SECRET = 'dev-only-insecure-secret';

const MIN_SECRET_LENGTH = 32;

/** Environments where the API may boot without a real `JWT_SECRET`. */
const LOCAL_ENVIRONMENTS = new Set(['development', 'test']);

const environmentSchema = z
  .object({
    NODE_ENV: z.string().trim().optional(),
    DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().trim().optional(),
  })
  .loose()
  .transform((env, ctx) => {
    const isLocal = LOCAL_ENVIRONMENTS.has(env.NODE_ENV ?? '');

    if (env.JWT_SECRET) {
      if (!isLocal && env.JWT_SECRET === DEV_JWT_SECRET) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must not be the public development fallback',
        });
      } else if (!isLocal && env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_SECRET'],
          message: `JWT_SECRET must have at least ${MIN_SECRET_LENGTH} characters`,
        });
      }
      return env;
    }

    if (!isLocal) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message:
          'JWT_SECRET is required unless NODE_ENV is "development" or "test" ' +
          '(set NODE_ENV=development in apps/api/.env for local runs)',
      });
      return z.NEVER;
    }

    return { ...env, JWT_SECRET: DEV_JWT_SECRET };
  });

/**
 * `ConfigModule` validation: the API refuses to boot with a missing or public
 * `JWT_SECRET` outside development and tests, instead of silently signing
 * tokens with a secret anyone can read in this repository.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `- ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}
