import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JWT_SECRET } from './jwt.config.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({ secret: JWT_SECRET }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
