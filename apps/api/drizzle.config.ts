import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  // Drizzle Kit loads `apps/api/.env` from the directory it runs in; the
  // connection string is only required by `migrate`, `push` and `studio`.
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
});
