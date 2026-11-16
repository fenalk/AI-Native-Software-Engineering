import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { validateEnvironment } from './auth/jwt.config.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { RATE_LIMIT_OPTIONS } from './common/rate-limit.js';
import { createValidationPipe } from './common/validation.pipe.js';
import { PostsModule } from './posts/posts.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // Validation fails the boot on a missing or public `JWT_SECRET` outside
    // development and tests (see `validateEnvironment`).
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    // `forRootAsync` reads the connection string when the application boots
    // instead of when this file is imported, so `.env` is already loaded.
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        drizzle,
        connection: configService.getOrThrow<string>('DATABASE_URL'),
      }),
    }),
    ThrottlerModule.forRoot(RATE_LIMIT_OPTIONS),
    UsersModule,
    AuthModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Registered here, through `APP_*` tokens, so tests that build the module
    // get the same pipes, guards and filters as the running application.
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    // Guards run in registration order: rate limiting comes before
    // authentication, so rejected credentials still count against the budget.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
