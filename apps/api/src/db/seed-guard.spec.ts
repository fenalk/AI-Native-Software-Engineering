import { assertSeedAllowed } from './seed-guard.js';

const LOCAL_URL = 'postgres://ainative:ainative@localhost:5433/ainative';
const REMOTE_URL = 'postgres://app:secret@db.internal.example.com:5432/app';

describe('assertSeedAllowed', () => {
  it.each([
    LOCAL_URL,
    'postgres://u:p@127.0.0.1:5433/db',
    'postgres://u:p@[::1]:5433/db',
  ])('allows a local database (%s)', (DATABASE_URL) => {
    expect(() =>
      assertSeedAllowed({ NODE_ENV: 'development', DATABASE_URL }),
    ).not.toThrow();
  });

  it('refuses production even on a local database', () => {
    expect(() =>
      assertSeedAllowed({ NODE_ENV: 'production', DATABASE_URL: LOCAL_URL }),
    ).toThrow(/NODE_ENV=production/);
  });

  it('refuses a remote database without explicit confirmation', () => {
    expect(() => assertSeedAllowed({ DATABASE_URL: REMOTE_URL })).toThrow(
      /SEED_ALLOW_REMOTE=true/,
    );
  });

  it('does not leak the credentials in the error', () => {
    expect(() => assertSeedAllowed({ DATABASE_URL: REMOTE_URL })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('secret'),
      }),
    );
  });

  it('allows a remote database once confirmed', () => {
    expect(() =>
      assertSeedAllowed({
        DATABASE_URL: REMOTE_URL,
        SEED_ALLOW_REMOTE: 'true',
      }),
    ).not.toThrow();
  });

  it('refuses a missing DATABASE_URL', () => {
    expect(() => assertSeedAllowed({})).toThrow(/missing or invalid/);
  });
});
