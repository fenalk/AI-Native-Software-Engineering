/**
 * Secret used to sign and verify access tokens. `JWT_SECRET` must be set in
 * production; the fallback only keeps local development and tests working.
 */
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-insecure-secret';
