import { DEVELOPMENT_JWT_SECRET, validateEnvironment } from './environment.js';

const databaseUrl = 'postgres://user:pass@localhost:5432/db';

describe('validateEnvironment', () => {
  it('falls back to the public development secret outside production', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: databaseUrl,
    });

    expect(environment.JWT_SECRET).toBe(DEVELOPMENT_JWT_SECRET);
  });

  it('keeps the configured secret when there is one', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: databaseUrl,
      JWT_SECRET: 'segredo-local-com-mais-de-32-caracteres',
    });

    expect(environment.JWT_SECRET).toBe(
      'segredo-local-com-mais-de-32-caracteres',
    );
  });

  it('refuses to boot in production without JWT_SECRET', () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: databaseUrl }),
    ).toThrow(/JWT_SECRET is required/);
  });

  it('refuses a short production secret', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        JWT_SECRET: 'curto',
      }),
    ).toThrow(/at least 32 characters/);
  });

  it('refuses the public fallback in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        JWT_SECRET: DEVELOPMENT_JWT_SECRET,
      }),
    ).toThrow(/public development fallback/);
  });

  it('accepts a strong production secret', () => {
    const secret = 'x'.repeat(48);

    expect(
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        JWT_SECRET: secret,
      }).JWT_SECRET,
    ).toBe(secret);
  });

  it('reports a missing DATABASE_URL instead of failing later', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'test' })).toThrow(
      /DATABASE_URL/,
    );
  });
});
