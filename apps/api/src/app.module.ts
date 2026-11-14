import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { createValidationPipe } from './common/validation.pipe.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    // Registered here, through `APP_*` tokens, so tests that build the module
    // get the same pipes, guards and filters as the running application.
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
