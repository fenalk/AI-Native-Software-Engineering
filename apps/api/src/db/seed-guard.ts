const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export interface SeedEnvironment {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  SEED_ALLOW_REMOTE?: string;
}

/**
 * The seed deletes every post and tag, so it only runs against a local
 * database outside production. Seeding a remote database (a shared dev box,
 * a container on another host) needs an explicit `SEED_ALLOW_REMOTE=true`.
 *
 * Throws with the reason; never prints the connection string.
 */
export function assertSeedAllowed(env: SeedEnvironment): void {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to run the destructive seed with NODE_ENV=production.',
    );
  }

  let host: string;
  try {
    host = new URL(env.DATABASE_URL ?? '').hostname;
  } catch {
    throw new Error('Refusing to seed: DATABASE_URL is missing or invalid.');
  }

  if (!LOCAL_HOSTS.has(host) && env.SEED_ALLOW_REMOTE !== 'true') {
    throw new Error(
      `Refusing to seed the non-local database host "${host}". ` +
        'The seed deletes every post and tag; set SEED_ALLOW_REMOTE=true to confirm.',
    );
  }
}
