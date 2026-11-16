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
    const instance = httpAdapter.getRequestUrl(ctx.getRequest());

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : statusFromRawError(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Never `this.logger.error(exception)`: the object carries `cause`,
      // stack and, for query errors, the SQL with its parameters.
      this.logger.error(
        `Unhandled error (${instance}): ${describeForLog(exception)}`,
      );
    }

    const { detail, errors } = describe(exception);
    const body: ProblemDetailsResponse = {
      type: 'about:blank',
      title: httpStatusTitle(status),
      status,
      detail:
        detail ??
        (status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'An unexpected error occurred.'
          : httpStatusTitle(status)),
      instance,
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

/**
 * Errors thrown by middleware (the body parser, for instance) are not
 * `HttpException`s but still carry a client-facing status, such as `413`.
 */
function statusFromRawError(exception: unknown): number {
  const status = (exception as { status?: unknown; statusCode?: unknown })
    ?.status;
  const statusCode = (exception as { statusCode?: unknown })?.statusCode;

  for (const candidate of [status, statusCode]) {
    if (typeof candidate === 'number' && candidate >= 400 && candidate < 500) {
      return candidate;
    }
  }

  // Only client errors the parser itself produces are trusted; anything else
  // stays the generic server error so internals never leak.
  return HttpStatus.INTERNAL_SERVER_ERROR;
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

/**
 * Shortest safe message from a logging perspective: class name and message
 * only. `cause`, `stack` and driver details stay out, because a
 * `DrizzleQueryError` carries the SQL **and its parameters** (emails, hashes,
 * comment bodies).
 */
export function describeForLog(exception: unknown): string {
  if (!(exception instanceof Error)) {
    return `NonError: ${typeof exception}`;
  }

  return `${exception.name}: ${summarizeParameters(exception.message)}`;
}

/** Blanks quoted literals so a message that inlines a parameter leaks nothing. */
function summarizeParameters(message: string): string {
  return message.replace(/(['"])[^'"]{1,200}\1/g, '$1<redacted>$1');
}
