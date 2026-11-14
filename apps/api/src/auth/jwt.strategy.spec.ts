import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UsersService } from '../users/users.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let findById: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findById = vi.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: { findById } },
      ],
    }).compile();

    strategy = moduleRef.get(JwtStrategy);
  });

  it('returns the user of the token subject', () => {
    const user = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      createdAt: new Date(),
    };
    findById.mockReturnValue(user);

    expect(strategy.validate({ sub: 'user-1', email: 'ada@example.com' })).toEqual(user);
    expect(findById).toHaveBeenCalledWith('user-1');
  });

  it('rejects a token whose user no longer exists', () => {
    findById.mockReturnValue(null);

    expect(() => strategy.validate({ sub: 'gone', email: 'ada@example.com' })).toThrow(
      UnauthorizedException,
    );
  });
});
