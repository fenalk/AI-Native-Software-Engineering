import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { PasswordHasherService } from '../users/password-hasher.service.js';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import type { AccessTokenResponseDto } from './access-token-response.dto.js';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_TTL_SECONDS,
  type AccessTokenPayload,
} from './access-token.js';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/** Persisted once, so the unknown-email path never blocks the event loop. */
const DUMMY_PASSWORD_SALT = randomBytes(16);
let dummyPasswordHashPromise: Promise<string> | null = null;

/**
 * A real `scrypt` record compared against when the email is unknown, so both
 * sign-in paths pay for one `scrypt`. It uses the same salt size and key length
 * as `PasswordHasherService`, which is what makes the timings comparable.
 */
function dummyPasswordHash(): Promise<string> {
  dummyPasswordHashPromise ??= scryptAsync(
    'unknown-email',
    DUMMY_PASSWORD_SALT,
    64,
  ).then(
    (hash) =>
      `scrypt$${DUMMY_PASSWORD_SALT.toString('hex')}$${hash.toString('hex')}`,
  );

  return dummyPasswordHashPromise;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Returns the user when the credentials match; otherwise sign-in fails with
   * `401`. A missing user still pays for one `scrypt` verification, so the
   * response time does not reveal which emails are registered.
   */
  async validateUser(email: string, password: string): Promise<User> {
    const credentials = await this.usersService.findCredentials(email);

    const matches = await this.passwordHasher.verify(
      password,
      credentials?.passwordHash ?? (await dummyPasswordHash()),
    );

    if (!credentials || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return credentials.user;
  }

  async login(user: User): Promise<AccessTokenResponseDto> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }
}
