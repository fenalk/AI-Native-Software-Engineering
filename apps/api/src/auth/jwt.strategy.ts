import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { readJwtSecret } from '../config/environment.js';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  type AccessTokenPayload,
} from './access-token.js';

/**
 * Validates the Bearer token and loads the user it belongs to. The returned
 * user becomes `request.user`. The secret comes from `ConfigService`, so it is
 * the value from `.env`/environment and never the import-time fallback.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: readJwtSecret(configService),
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }
    return user;
  }
}
