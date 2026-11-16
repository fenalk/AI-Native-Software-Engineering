import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.js';

/** The database registered by `DrizzleModule` in `AppModule`. */
export type Database = NodePgDatabase<typeof schema>;
