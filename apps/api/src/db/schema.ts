import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Persistent users. The password hash never leaves the server: the HTTP layer
 * only sees `User`.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Emails are normalized (trim + lowercase) before they reach this column, so
  // a plain unique constraint is enough and doubles as the sign-in index.
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
