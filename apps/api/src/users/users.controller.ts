import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import {
  ApiProblemBadRequestResponse,
  ApiProblemConflictResponse,
  ApiProblemTooManyRequestsResponse,
  ApiProblemUnauthorizedResponse,
} from '../common/api-problem-response.decorator.js';
import { AuthRateLimit } from '../common/rate-limit.js';
import type { User } from './user.js';
import { UserResponseDto } from './user-response.dto.js';
import { createUserSchema, type CreateUserInput } from './users.schemas.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @AuthRateLimit()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a user' })
  @ApiHeader({
    name: 'Location',
    description: 'Path of the registered user.',
    schema: { example: '/users/9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b' },
  })
  @ApiCreatedResponse({
    description: 'User registered.',
    type: UserResponseDto,
  })
  @ApiProblemBadRequestResponse()
  @ApiProblemConflictResponse()
  @ApiProblemTooManyRequestsResponse()
  async create(
    @Body({ schema: createUserSchema }) input: CreateUserInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.usersService.create(input);
    response.setHeader('Location', `/users/${user.id}`);
    return user;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read the signed-in user' })
  @ApiOkResponse({ description: 'The signed-in user.', type: UserResponseDto })
  @ApiProblemUnauthorizedResponse()
  getMe(@CurrentUser() user: User) {
    return this.usersService.getById(user.id);
  }
}
