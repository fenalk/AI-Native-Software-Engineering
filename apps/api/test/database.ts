/**
 * Connection used by the e2e suite. The default matches `apps/api/.env.example`
 * and the database created by `docker/postgres/init`; override it with
 * `TEST_DATABASE_URL` to point somewhere else.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://ainative:ainative@localhost:5433/ainative_test';
