import { assertSeedAllowed, RemoteDatabaseError } from './seed-guard.js';

const localUrl = 'postgres://ainative:ainative@localhost:5433/ainative';

describe('assertSeedAllowed', () => {
  it('allows the local database used in development', () => {
    expect(() =>
      assertSeedAllowed({ DATABASE_URL: localUrl, NODE_ENV: 'development' }),
    ).not.toThrow();
  });

  it('allows a loopback address', () => {
    expect(() =>
      assertSeedAllowed({
        DATABASE_URL: 'postgres://ainative:ainative@127.0.0.1:5432/ainative',
      }),
    ).not.toThrow();
  });

  it('refuses production regardless of the host', () => {
    expect(() =>
      assertSeedAllowed({ DATABASE_URL: localUrl, NODE_ENV: 'production' }),
    ).toThrow(RemoteDatabaseError);
  });

  it('refuses a remote host, which would wipe a shared database', () => {
    // The seed deletes every post and tag; a misconfigured DATABASE_URL used
    // to be enough to erase a real feed.
    expect(() =>
      assertSeedAllowed({
        DATABASE_URL: 'postgres://ainative:secret@db.example.com:5432/ainative',
      }),
    ).toThrow(/remote database "db\.example\.com"/);
  });

  it('refuses without a connection string', () => {
    expect(() => assertSeedAllowed({})).toThrow(/DATABASE_URL is not set/);
  });

  it('accepts a remote host when the override is explicit', () => {
    expect(() =>
      assertSeedAllowed({
        DATABASE_URL: 'postgres://ainative:secret@db.example.com:5432/ainative',
        SEED_ALLOW_REMOTE: 'true',
      }),
    ).not.toThrow();
  });
});
