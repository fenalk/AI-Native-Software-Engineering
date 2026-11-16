import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordHasherService } from '../users/password-hasher.service.js';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import type { AccessTokenResponseDto } from './access-token-response.dto.js';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_TTL_SECONDS,
  type AccessTokenPayload,
} from './access-token.js';

/** Compared against when the email is unknown, so both paths cost one `scrypt`. */
const DUMMY_PASSWORD_HASH =
  'scrypt$00000000000000000000000000000000$' + '0'.repeat(128);

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
      credentials?.passwordHash ?? DUMMY_PASSWORD_HASH,
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
