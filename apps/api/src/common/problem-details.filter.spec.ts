import { HttpException, Logger, type ArgumentsHost } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  ProblemDetailsFilter,
  describeForLog,
} from './problem-details.filter.js';

function fakeHost(url = '/posts') {
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({ setHeader: vi.fn() }),
    }),
  } as unknown as ArgumentsHost;

  const httpAdapterHost = {
    httpAdapter: {
      getRequestUrl: () => url,
      reply: vi.fn(),
    },
  } as unknown as HttpAdapterHost;

  return { host, httpAdapterHost };
}

describe('describeForLog', () => {
  it('keeps the class name and blanks quoted parameters', () => {
    // Shaped like a `DrizzleQueryError`: the message inlines the statement and
    // its parameters, including emails and password hashes.
    const error = new Error(
      "Failed query: insert into users values ($1, $2) params: 'ada@example.com', 'scrypt$abc$def'",
    );
    error.name = 'DrizzleQueryError';

    const line = describeForLog(error);

    expect(line.startsWith('DrizzleQueryError: Failed query')).toBe(true);
    expect(line).not.toContain('ada@example.com');
    expect(line).not.toContain('scrypt$abc$def');
  });

  it('does not print a stack or a cause', () => {
    const cause = new Error('password_hash=segredo');
    const error = new Error('boom', { cause });

    const line = describeForLog(error);

    expect(line).toBe('Error: boom');
    expect(line).not.toContain('at ');
    expect(line).not.toContain('segredo');
  });

  it('describes non-Error values by type only', () => {
    expect(describeForLog('senha-segura')).toBe('NonError: string');
    expect(describeForLog(undefined)).toBe('NonError: undefined');
  });
});

describe('ProblemDetailsFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs an internal error without the parameters in the message', () => {
    const { host, httpAdapterHost } = fakeHost();
    const errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation();
    const filter = new ProblemDetailsFilter(httpAdapterHost);

    filter.catch(new Error("params: 'ada@example.com', 'senha-segura'"), host);

    expect(errorLog).toHaveBeenCalledTimes(1);
    const [logged, ...rest] = errorLog.mock.calls[0];
    expect(String(logged)).toContain('Error:');
    expect(String(logged)).not.toContain('ada@example.com');
    expect(String(logged)).not.toContain('senha-segura');
    // The exception object itself (with stack and cause) must not be passed.
    expect(rest).toHaveLength(0);
    // The redaction is logged, so the console stays quiet during the suite.
    expect(String(logged)).toContain("'<redacted>'");
  });

  it('does not log client errors', () => {
    const { host, httpAdapterHost } = fakeHost('/sessions');
    const errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation();
    const filter = new ProblemDetailsFilter(httpAdapterHost);

    filter.catch(new HttpException('Too many requests', 429), host);

    expect(errorLog).not.toHaveBeenCalled();
  });
});
