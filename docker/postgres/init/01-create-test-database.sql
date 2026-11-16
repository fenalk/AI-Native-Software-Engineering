-- Separate database for the e2e suite (see apps/api/vitest.config.e2e.ts), so
-- `pnpm api test:e2e` never truncates the development data.
--
-- This script only runs when the `postgres-data` volume is created for the
-- first time. With an existing volume, create the database manually:
--   docker compose exec postgres createdb -U ainative ainative_test
CREATE DATABASE ainative_test;
