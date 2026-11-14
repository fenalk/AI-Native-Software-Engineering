import { StandardSchemaValidationPipe } from '@nestjs/common';
import { validationExceptionFactory } from './validation-problem.js';

/** Global validation pipe; failures surface as validation problems. */
export function createValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: validationExceptionFactory,
  });
}
