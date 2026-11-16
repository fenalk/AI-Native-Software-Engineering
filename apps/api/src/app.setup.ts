import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

/** Largest JSON or form body the API parses; bigger requests get `413`. */
export const BODY_LIMIT = '100kb';

/**
 * HTTP hardening shared by `main.ts` and the e2e suites, so the tests exercise
 * the same headers and limits as the running server.
 */
export function configureApp(app: NestExpressApplication): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Swagger UI (`/docs`) inlines its styles; scripts stay `'self'`.
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: BODY_LIMIT, extended: true });
}
