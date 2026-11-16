/**
 * Guard for scripts that wipe data. `pnpm api db:seed` deletes every post and
 * tag and resets the password of the demo accounts, so pointing
 * `DATABASE_URL` at anything other than a local database must be explicit.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export class RemoteDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoteDatabaseError';
  }
}

/**
 * Throws when the seed would run against production or a remote host. The
 * override exists so a disposable staging database can still be seeded, and it
 * has to be spelled out explicitly:
 * `SEED_ALLOW_REMOTE=true pnpm api db:seed`.
 */
export function assertSeedAllowed(
  environment: Record<string, string | undefined> = process.env,
): void {
  if (environment.NODE_ENV === 'production') {
    throw new RemoteDatabaseError(
      'Refusing to seed with NODE_ENV=production: the seed deletes every post and tag.',
    );
  }

  const databaseUrl = environment.DATABASE_URL;
  if (!databaseUrl) {
    throw new RemoteDatabaseError('DATABASE_URL is not set.');
  }

  if (environment.SEED_ALLOW_REMOTE === 'true') {
    return;
  }

  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new RemoteDatabaseError(
      'DATABASE_URL is not a valid connection string.',
    );
  }

  if (!LOCAL_HOSTS.has(host)) {
    throw new RemoteDatabaseError(
      `Refusing to seed the remote database "${host}": the seed is destructive. Use SEED_ALLOW_REMOTE=true to override.`,
    );
  }
}
