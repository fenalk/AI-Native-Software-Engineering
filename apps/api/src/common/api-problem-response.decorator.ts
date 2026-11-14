import { HttpStatus } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ProblemDetailsDto } from './problem-details.dto.js';

const PROBLEM_CONTENT = 'application/problem+json';

/** Documents a non-2xx response in the RFC 9457 format produced by `ProblemDetailsFilter`. */
function problemResponse(status: HttpStatus, description: string) {
  return ApiResponse({
    status,
    description,
    content: {
      [PROBLEM_CONTENT]: { schema: { $ref: getSchemaPath(ProblemDetailsDto) } },
    },
  });
}

export const ApiProblemBadRequestResponse = () =>
  problemResponse(HttpStatus.BAD_REQUEST, 'The request payload is invalid.');

export const ApiProblemUnauthorizedResponse = () =>
  problemResponse(
    HttpStatus.UNAUTHORIZED,
    'Missing, invalid or expired access token, or invalid credentials.',
  );

export const ApiProblemNotFoundResponse = () =>
  problemResponse(HttpStatus.NOT_FOUND, 'The resource does not exist.');

export const ApiProblemConflictResponse = () =>
  problemResponse(
    HttpStatus.CONFLICT,
    'The resource conflicts with existing data.',
  );

export const ApiProblemInternalServerErrorResponse = () =>
  problemResponse(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred.',
  );
