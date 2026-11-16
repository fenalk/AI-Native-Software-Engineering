/** Lifetime of an access token, shared by signing and the login response. */
export const ACCESS_TOKEN_TTL_SECONDS = 3600;
export const ACCESS_TOKEN_EXPIRES_IN = `${ACCESS_TOKEN_TTL_SECONDS}s`;

/**
 * Fixed claims of every token this API issues. Verification requires both, so a
 * token minted for another service with the same secret is rejected.
 */
export const JWT_ISSUER = 'code-connect-api';
export const JWT_AUDIENCE = 'code-connect-web';

/** Payload carried inside the JWT. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
}
