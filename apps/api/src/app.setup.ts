import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Largest JSON body the API accepts. It matches the Express default and is
 * declared here so the contract is explicit: a bigger body answers `413`.
 */
export const BODY_LIMIT_BYTES = 100 * 1024;

interface BodyParserAdapter {
  useBodyParser(
    type: 'json',
    rawBody: boolean,
    options: { limit: string },
  ): unknown;
  getInstance(): {
    disable(setting: string): void;
    use(...handlers: unknown[]): void;
  };
}

/**
 * HTTP hardening shared by `main.ts` and the e2e suites, so a test can assert
 * the headers and limits the deployed app actually serves.
 */
export function configureApp(app: INestApplication): void {
  const adapter = app.getHttpAdapter() as unknown as BodyParserAdapter;
  const express = adapter.getInstance();

  // Do not advertise the stack (and its version) to anonymous clients.
  express.disable('x-powered-by');

  // Response headers: no MIME sniffing, no framing, a strict referrer policy
  // and HSTS. CSP is left to the host that serves the web app.
  express.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Re-register the JSON parser so the limit is part of the code, not inherited
  // from a dependency default. Nest still exposes the raw body when needed.
  adapter.useBodyParser('json', true, {
    limit: `${Math.floor(BODY_LIMIT_BYTES / 1024)}kb`,
  });
}
