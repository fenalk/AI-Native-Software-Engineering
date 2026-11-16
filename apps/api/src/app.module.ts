import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { GLOBAL_RATE_LIMIT, RateLimitGuard } from './common/rate-limit.js';
import { createValidationPipe } from './common/validation.pipe.js';
import { validateEnvironment } from './config/environment.js';
import { PostsModule } from './posts/posts.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Reads `.env` and fails the boot when a required variable is missing or
      // weak, instead of letting modules fall back to a public default.
      validate: validateEnvironment,
    }),
    // `forRootAsync` reads the connection string when the application boots
    // instead of when this file is imported, so `.env` is already loaded.
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        drizzle,
        connection: configService.getOrThrow<string>('DATABASE_URL'),
      }),
    }),
    // In-memory storage: enough for one instance and for the e2e suites. A
    // multi-instance deployment needs a shared store.
    ThrottlerModule.forRoot([GLOBAL_RATE_LIMIT]),
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
    // Rate limit before authentication, so a flood cannot reach `scrypt`.
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
