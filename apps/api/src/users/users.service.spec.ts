import { Test } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PasswordHasherService } from './password-hasher.service.js';

describe('UsersService', () => {
  let usersService: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, PasswordHasherService],
    }).compile();

    usersService = moduleRef.get(UsersService);
  });

  it('registers a user without exposing the password', async () => {
    const user = await usersService.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'senha-segura',
    });

    expect(user).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(user.id).toEqual(expect.any(String));
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('normalizes the email before storing it', async () => {
    const user = await usersService.create({
      name: 'Ada Lovelace',
      email: '  Ada@Example.COM  ',
      password: 'senha-segura',
    });

    expect(user.email).toBe('ada@example.com');
  });

  it('rejects an email that is already registered', async () => {
    await usersService.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'senha-segura',
    });

    await expect(
      usersService.create({
        name: 'Ada again',
        email: 'ADA@example.com',
        password: 'outra-senha',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejects a duplicate registered while the first request awaited the hash', async () => {
    const input = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'senha-segura',
    };

    const results = await Promise.allSettled([
      usersService.create(input),
      usersService.create({ ...input, name: 'Ada race' }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({ reason: { status: 409 } });
  });

  it('finds a user by id and returns null for an unknown id', async () => {
    const created = await usersService.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'senha-segura',
    });

    expect(usersService.findById(created.id)).toEqual(created);
    expect(usersService.findById('missing')).toBeNull();
  });

  it('returns the credentials of a registered user', async () => {
    const created = await usersService.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'senha-segura',
    });

    const credentials = usersService.findCredentials('ADA@example.com');

    expect(credentials?.user).toEqual(created);
    expect(credentials?.passwordHash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(usersService.findCredentials('nobody@example.com')).toBeNull();
  });
});
