import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { TEST_DATABASE_URL } from './database.js';

/**
 * Applies pending migrations to the e2e database before the suite runs, so
 * `pnpm api test:e2e` only needs the Docker container up.
 */
export default async function setup(): Promise<void> {
  const db = drizzle(TEST_DATABASE_URL);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
  } finally {
    await db.$client.end();
  }
}
