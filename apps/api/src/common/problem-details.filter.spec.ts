import {
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  type ArgumentsHost,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { ProblemDetailsFilter } from './problem-details.filter.js';

function run(exception: unknown) {
  const reply = vi.fn();
  const setHeader = vi.fn();
  const adapterHost = {
    httpAdapter: { reply, getRequestUrl: () => '/posts' },
  } as unknown as HttpAdapterHost;
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({ setHeader }),
    }),
  } as unknown as ArgumentsHost;

  new ProblemDetailsFilter(adapterHost).catch(exception, host);

  const [, body, status] = reply.mock.calls[0];
  return { body, status, setHeader };
}

describe('ProblemDetailsFilter', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('keeps the message of a client error', () => {
    const { body, status, setHeader } = run(
      new NotFoundException('Post not found'),
    );

    expect(status).toBe(404);
    expect(body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Post not found',
      instance: '/posts',
    });
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/problem+json',
    );
  });

  it('keeps validation issues on a 400', () => {
    const errors = [{ path: 'title', message: 'Required' }];
    const { body } = run(
      new BadRequestException({ message: 'Invalid request', errors }),
    );

    expect(body).toMatchObject({ detail: 'Invalid request', errors });
  });

  it('hides the message and cause of a 5xx HttpException', () => {
    const { body, status } = run(
      new InternalServerErrorException(
        'duplicate key value violates unique constraint "users_email_unique"',
        { cause: new Error('connection to 10.0.0.5:5432 refused') },
      ),
    );

    expect(status).toBe(500);
    expect(body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred.',
      instance: '/posts',
    });
    expect(JSON.stringify(body)).not.toMatch(/users_email|10\.0\.0\.5|stack/);
  });

  it('hides the message of other 5xx statuses', () => {
    const { body } = run(
      new HttpException('upstream db at pg://secret', HttpStatus.BAD_GATEWAY),
    );

    expect(body).toMatchObject({
      status: 502,
      detail: 'An unexpected error occurred.',
    });
  });

  it('answers a non-HTTP error with a generic 500', () => {
    const { body, status } = run(new Error('relation "posts" does not exist'));

    expect(status).toBe(500);
    expect(body.detail).toBe('An unexpected error occurred.');
  });
});
