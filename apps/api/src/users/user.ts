import type { UserRow } from '../db/schema.js';

/** A user as the outside world sees it: never carries the password hash. */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/** The database row behind a `User`. Stays inside `UsersService`. */
export type UserRecord = UserRow;

export function toUser({ id, name, email, createdAt }: UserRecord): User {
  return { id, name, email, createdAt };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
