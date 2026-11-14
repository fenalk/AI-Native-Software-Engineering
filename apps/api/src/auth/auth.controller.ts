import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiProblemBadRequestResponse,
  ApiProblemUnauthorizedResponse,
} from '../common/api-problem-response.decorator.js';
import { AccessTokenResponseDto } from './access-token-response.dto.js';
import { signInSchema, type SignInInput } from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';

@ApiTags('sessions')
@Controller('sessions')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in',
    description:
      'Exchanges email and password for a stateless access token. Nothing is stored, so the response is `200`, not `201`.',
  })
  @ApiOkResponse({
    description: 'Credentials accepted.',
    type: AccessTokenResponseDto,
  })
  @ApiProblemBadRequestResponse()
  @ApiProblemUnauthorizedResponse()
  async signIn(@Body({ schema: signInSchema }) input: SignInInput) {
    const user = await this.authService.validateUser(
      input.email,
      input.password,
    );
    return this.authService.login(user);
  }
}
