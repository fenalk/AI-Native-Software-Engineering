import { slugify } from '../common/slug.js';
import type { UserRow } from '../db/schema.js';

/** A user as the outside world sees it: never carries the password hash. */
export interface User {
  id: string;
  name: string;
  email: string;
  /** Public handle, without the leading `@`. */
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
}

/** The database row behind a `User`. Stays inside `UsersService`. */
export type UserRecord = UserRow;

/**
 * Derives the public handle when the row has no explicit username, which is
 * the case for accounts created through `POST /users`.
 */
export function toUsername(
  username: string | null,
  name: string,
  id: string,
): string {
  return username ?? (slugify(name) || `user-${id.slice(0, 8)}`);
}

export function toUser({
  id,
  name,
  email,
  username,
  avatarUrl,
  createdAt,
}: UserRecord): User {
  return {
    id,
    name,
    email,
    username: toUsername(username, name, id),
    avatarUrl: avatarUrl ?? null,
    createdAt,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
