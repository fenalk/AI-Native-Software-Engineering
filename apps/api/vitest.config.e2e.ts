import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './test/database.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/e2e.setup.ts'],
    // Every application the suite builds talks to the test database, never to
    // the development one.
    env: { DATABASE_URL: TEST_DATABASE_URL },
    // The suites share the same test database and truncate it before each
    // test, so they must not run concurrently.
    fileParallelism: false,
  },
});
