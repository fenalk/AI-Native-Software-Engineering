import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { VALIDATION_PROBLEM_DETAIL } from './validation-problem.js';
import type { ValidationIssueDto } from './problem-details.dto.js';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';

interface ProblemDetailsResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: ValidationIssueDto[];
}

/**
 * Turns every unhandled exception into an RFC 9457 problem details body, so
 * no endpoint answers outside 2xx with the default Nest envelope.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    // Only client errors (4xx) carry a message chosen by the application.
    // A 5xx — even an `HttpException` built from a driver error — never
    // echoes its message, `cause` or stack back to the client.
    const { detail, errors } =
      status < HttpStatus.INTERNAL_SERVER_ERROR ? describe(exception) : {};
    const body: ProblemDetailsResponse = {
      type: 'about:blank',
      title: httpStatusTitle(status),
      status,
      detail:
        detail ??
        (status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'An unexpected error occurred.'
          : httpStatusTitle(status)),
      instance: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    if (errors) {
      body.errors = errors;
    }

    const response = ctx.getResponse();
    response.setHeader('Content-Type', PROBLEM_CONTENT_TYPE);
    httpAdapter.reply(response, body, status);
  }
}

interface ExceptionDetail {
  detail?: string;
  errors?: ValidationIssueDto[];
}

/** Reads the human-readable message, and any validation issues, off an exception. */
function describe(exception: unknown): ExceptionDetail {
  if (!(exception instanceof HttpException)) {
    return {};
  }

  const body = exception.getResponse();
  if (typeof body === 'string') {
    return { detail: body };
  }
  if (typeof body !== 'object' || body === null) {
    return {};
  }

  const { message, errors } = body as { message?: unknown; errors?: unknown };

  // Validation failures arrive as `{ message, error, errors }`: a fixed detail
  // plus one issue per invalid property.
  if (Array.isArray(errors)) {
    return {
      detail: typeof message === 'string' ? message : VALIDATION_PROBLEM_DETAIL,
      errors: errors as ValidationIssueDto[],
    };
  }

  if (typeof message === 'string') {
    return { detail: message };
  }
  if (Array.isArray(message)) {
    return { detail: message.map(String).join('; ') };
  }

  return {};
}

const STATUS_TITLES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [HttpStatus.NOT_ACCEPTABLE]: 'Not Acceptable',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

function httpStatusTitle(status: number): string {
  return STATUS_TITLES[status] ?? 'Error';
}
