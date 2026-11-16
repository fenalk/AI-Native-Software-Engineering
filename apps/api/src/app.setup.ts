import type { INestApplication } from '@nestjs/common';

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
  getInstance(): { disable(setting: string): void };
}

/**
 * HTTP hardening shared by `main.ts` and the e2e suites, so a test can assert
 * the headers and limits the deployed app actually serves.
 */
export function configureApp(app: INestApplication): void {
  const adapter = app.getHttpAdapter() as unknown as BodyParserAdapter;

  // Do not advertise the stack (and its version) to anonymous clients.
  adapter.getInstance().disable('x-powered-by');

  // Re-register the JSON parser so the limit is part of the code, not inherited
  // from a dependency default. Nest still exposes the raw body when needed.
  adapter.useBodyParser('json', true, {
    limit: `${Math.floor(BODY_LIMIT_BYTES / 1024)}kb`,
  });
}
