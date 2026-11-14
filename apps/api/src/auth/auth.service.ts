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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtService: JwtService,
  ) {}

  /** Returns the user when the credentials match; otherwise sign-in fails with `401`. */
  async validateUser(email: string, password: string): Promise<User> {
    const credentials = this.usersService.findCredentials(email);
    const matches =
      credentials &&
      (await this.passwordHasher.verify(password, credentials.passwordHash));

    if (!matches) {
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
