import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PasswordHasherService } from '../users/password-hasher.service.js';
import type { UserRecord } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let signAsync: ReturnType<typeof vi.fn>;
  let records: Map<string, UserRecord>;

  beforeEach(async () => {
    records = new Map();
    signAsync = vi.fn().mockResolvedValue('signed-token');

    const usersRepository = {
      findById: vi.fn(async (id: string) => records.get(id) ?? null),
      findByEmail: vi.fn(
        async (email: string) =>
          [...records.values()].find((record) => record.email === email) ??
          null,
      ),
      insert: vi.fn(async (record: UserRecord) => {
        records.set(record.id, record);
        return record;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        PasswordHasherService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: { signAsync } },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
  });

  async function registerUser() {
    return usersService.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'senha-segura',
    });
  }

  it('returns the user when the password matches', async () => {
    const user = await registerUser();

    await expect(
      authService.validateUser('ada@example.com', 'senha-segura'),
    ).resolves.toEqual(user);
  });

  it('rejects a wrong password with 401', async () => {
    await registerUser();

    await expect(
      authService.validateUser('ada@example.com', 'wrong-password'),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects an unknown email with 401', async () => {
    await expect(
      authService.validateUser('nobody@example.com', 'senha-segura'),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('signs an access token for the user', async () => {
    const user = await registerUser();

    const session = await authService.login(user);

    expect(session).toEqual({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    expect(signAsync).toHaveBeenCalledWith(
      { sub: user.id, email: 'ada@example.com' },
      { expiresIn: '3600s' },
    );
  });
});
