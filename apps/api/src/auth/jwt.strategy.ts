import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import type { AccessTokenPayload } from './access-token.js';
import { JWT_SECRET } from './jwt.config.js';

/**
 * Validates the Bearer token and loads the user it belongs to. The returned
 * user becomes `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  validate(payload: AccessTokenPayload): User {
    const user = this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }
    return user;
  }
}
