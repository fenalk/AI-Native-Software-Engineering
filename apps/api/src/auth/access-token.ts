/** Lifetime of an access token, shared by signing and the login response. */
export const ACCESS_TOKEN_TTL_SECONDS = 3600;
export const ACCESS_TOKEN_EXPIRES_IN = `${ACCESS_TOKEN_TTL_SECONDS}s`;

/** Payload carried inside the JWT. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
}
