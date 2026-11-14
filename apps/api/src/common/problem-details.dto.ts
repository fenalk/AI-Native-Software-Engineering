import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * An entry in the `errors` member of a problem details response, as returned
 * when a request body fails validation.
 */
export class ValidationIssueDto {
  @ApiProperty({
    description: 'Dotted path of the offending property.',
    example: 'password',
  })
  path: string;

  @ApiProperty({
    description: 'Why the property is invalid.',
    example: 'Too small: expected string to have >=8 characters',
  })
  message: string;
}

/**
 * Error body of every non-2xx response, following RFC 9457 and served as
 * `application/problem+json`.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export class ProblemDetailsDto {
  @ApiProperty({
    description: 'URI reference identifying the problem type.',
    example: 'about:blank',
  })
  type: string;

  @ApiProperty({
    description: 'Short, human-readable summary of the problem type.',
    example: 'Conflict',
  })
  title: string;

  @ApiProperty({ description: 'HTTP status code.', example: 409 })
  status: number;

  @ApiProperty({
    description: 'Explanation specific to this occurrence of the problem.',
    example: 'Email already registered',
  })
  detail: string;

  @ApiProperty({
    description: 'Path of the request that caused the problem.',
    example: '/users',
  })
  instance: string;

  @ApiPropertyOptional({
    type: [ValidationIssueDto],
    description: 'Per-property issues, present when the request failed validation.',
  })
  errors?: ValidationIssueDto[];
}
