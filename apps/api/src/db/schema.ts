import { sql } from 'drizzle-orm';
import {
  customType,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

/** PostgreSQL `tsvector`; only used by the generated `posts.search_document`. */
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

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
  // Optional public identity: seeded accounts carry an explicit handle and
  // avatar; real accounts fall back to a slug derived from the name.
  username: text('username').unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** A published post: short description plus the code/content shown on detail. */
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    content: text('content').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Generated column: PostgreSQL keeps it in sync and the GIN index below
    // makes `websearch_to_tsquery` searches cheap.
    searchDocument: tsvector('search_document').generatedAlwaysAs(
      sql`to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))`,
    ),
  },
  (table) => [
    index('posts_search_idx').using('gin', table.searchDocument),
    index('posts_created_at_idx').on(table.createdAt),
  ],
);

/** Free-form labels used by the feed filter. */
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

/** Many-to-many between posts and tags. */
export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index('post_tags_tag_idx').on(table.tagId, table.postId),
  ],
);

/** One row per like; the composite primary key makes liking idempotent. */
export const postLikes = pgTable(
  'post_likes',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId] }),
    index('post_likes_user_idx').on(table.userId),
  ],
);

/** Comments and one level of replies (`parent_id` points at a top-level comment). */
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => comments.id, {
      onDelete: 'cascade',
    }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('comments_post_idx').on(table.postId, table.createdAt)],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
export type TagRow = typeof tags.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
