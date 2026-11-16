import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { UsersService } from '../users/users.service.js';
import { JwtStrategy } from './jwt.strategy.js';

const secret = 'segredo-de-teste-com-pelo-menos-32-caracteres';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let findById: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findById = vi.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: { findById } },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'JWT_SECRET' ? secret : undefined),
            getOrThrow: (key: string) => {
              if (key !== 'JWT_SECRET') {
                throw new Error(`Missing ${key}`);
              }
              return secret;
            },
          },
        },
      ],
    }).compile();

    strategy = moduleRef.get(JwtStrategy);
  });

  it('returns the user of the token subject', async () => {
    const user = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      username: 'ada',
      avatarUrl: null,
      createdAt: new Date(),
    };
    findById.mockResolvedValue(user);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'ada@example.com' }),
    ).resolves.toEqual(user);
    expect(findById).toHaveBeenCalledWith('user-1');
  });

  it('rejects a token whose user no longer exists', async () => {
    findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'gone', email: 'ada@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('pins the expected claims and algorithm', () => {
    // Every field below is read by passport-jwt before `validate` runs: a
    // regression here re-opens token forging with the public dev fallback or
    // with a secret shared by another service.
    const strategyWithInternals = strategy as unknown as {
      _secretOrKeyProvider: (
        request: unknown,
        rawToken: string,
        done: (error: unknown, key?: string) => void,
      ) => void;
      _verifOpts: { algorithms?: string[]; issuer?: string; audience?: string };
    };

    let resolvedSecret: string | undefined;
    strategyWithInternals._secretOrKeyProvider(
      {},
      'raw-token',
      (_error, key) => {
        resolvedSecret = key;
      },
    );

    expect(resolvedSecret).toBe(secret);
    expect(resolvedSecret).not.toBe('dev-only-insecure-secret');
    expect(strategyWithInternals._verifOpts).toMatchObject({
      algorithms: ['HS256'],
      issuer: 'code-connect-api',
      audience: 'code-connect-web',
    });
  });
});
