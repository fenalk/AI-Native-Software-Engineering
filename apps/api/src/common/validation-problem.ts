import { BadRequestException } from '@nestjs/common';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ValidationIssueDto } from './problem-details.dto.js';

/** Detail written into a validation problem, shared by the pipe and the filter. */
export const VALIDATION_PROBLEM_DETAIL = 'The request payload is invalid.';

/** Shape `BadRequestException` produces for a failed validation. */
export interface ProblemDetailsBody {
  message: string;
  errors: ValidationIssueDto[];
}

/** Maps the issues of a Standard Schema to `{ path, message }` pairs. */
export function toValidationIssues(
  issues: readonly StandardSchemaV1.Issue[],
): ValidationIssueDto[] {
  return issues.map((issue) => ({
    path: (issue.path ?? [])
      .map((segment) =>
        String(typeof segment === 'object' ? segment.key : segment),
      )
      .join('.'),
    message: issue.message,
  }));
}

/**
 * `exceptionFactory` for `StandardSchemaValidationPipe`: a `400` carrying one
 * issue per invalid property, which `ProblemDetailsFilter` exposes as `errors`.
 */
export function validationExceptionFactory(
  issues: readonly StandardSchemaV1.Issue[],
): BadRequestException {
  const body: ProblemDetailsBody = {
    message: VALIDATION_PROBLEM_DETAIL,
    errors: toValidationIssues(issues),
  };

  return new BadRequestException(body);
}
