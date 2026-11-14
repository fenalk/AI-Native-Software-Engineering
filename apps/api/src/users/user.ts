/** A user as the outside world sees it: never carries the password hash. */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/** The in-memory row behind a `User`. Stays inside `UsersService`. */
export interface UserRecord extends User {
  passwordHash: string;
}

export function toUser({ id, name, email, createdAt }: UserRecord): User {
  return { id, name, email, createdAt };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
