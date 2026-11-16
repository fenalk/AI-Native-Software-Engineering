import { Module } from '@nestjs/common';
import { PasswordHasherService } from './password-hasher.service.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, PasswordHasherService],
  exports: [UsersService, PasswordHasherService],
})
export class UsersModule {}
