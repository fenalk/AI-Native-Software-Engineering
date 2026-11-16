import { DEV_JWT_SECRET, validateEnvironment } from './jwt.config.js';

const DATABASE_URL = 'postgres://user:pass@localhost:5433/db';
const STRONG_SECRET = 'a'.repeat(48);

describe('validateEnvironment', () => {
  it.each(['development', 'test'])(
    'falls back to the development secret when NODE_ENV=%s',
    (NODE_ENV) => {
      expect(validateEnvironment({ NODE_ENV, DATABASE_URL })).toMatchObject({
        JWT_SECRET: DEV_JWT_SECRET,
      });
    },
  );

  it.each([undefined, 'production', 'staging'])(
    'refuses to boot without JWT_SECRET when NODE_ENV=%s',
    (NODE_ENV) => {
      expect(() => validateEnvironment({ NODE_ENV, DATABASE_URL })).toThrow(
        /JWT_SECRET is required/,
      );
    },
  );

  it('refuses the public development secret in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL,
        JWT_SECRET: DEV_JWT_SECRET,
      }),
    ).toThrow(/development fallback/);
  });

  it('refuses a short secret in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL,
        JWT_SECRET: 'short',
      }),
    ).toThrow(/at least 32 characters/);
  });

  it('keeps a strong secret and the other variables', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL,
        JWT_SECRET: STRONG_SECRET,
        PORT: '8080',
      }),
    ).toMatchObject({ JWT_SECRET: STRONG_SECRET, PORT: '8080' });
  });

  it('requires DATABASE_URL', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'test' })).toThrow(
      /DATABASE_URL/,
    );
  });
});
