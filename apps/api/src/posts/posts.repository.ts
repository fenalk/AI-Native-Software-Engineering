import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { slugify } from '../common/slug.js';
import type { Database } from '../db/database.js';
import {
  comments,
  postLikes,
  posts,
  postTags,
  tags,
  users,
  type CommentRow,
  type PostRow,
  type TagRow,
  type UserRow,
} from '../db/schema.js';
import type { CreatePostInput } from './posts.schemas.js';

export type PostSort = 'recent' | 'popular';

export interface PostFilters {
  search?: string;
  tagSlugs: string[];
  sort: PostSort;
  limit: number;
  offset: number;
  viewerId: string | null;
}

export interface PostRowWithMeta {
  post: PostRow;
  author: UserRow;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
}

export interface PostTagRef {
  slug: string;
  name: string;
}

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Every query the posts feature runs against PostgreSQL. */
@Injectable()
export class PostsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  private likesCountSql = sql<number>`(select count(*)::int from ${postLikes} where ${postLikes.postId} = ${posts.id})`;

  private commentsCountSql = sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${posts.id})`;

  private likedByMeSql(viewerId: string | null): SQL<boolean> {
    return viewerId
      ? sql<boolean>`exists (select 1 from ${postLikes} where ${postLikes.postId} = ${posts.id} and ${postLikes.userId} = ${viewerId})`
      : sql<boolean>`false`;
  }

  /** Builds the shared `WHERE` for the list, its page and its total count. */
  private whereClause({ search, tagSlugs }: PostFilters): SQL | undefined {
    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        sql`${posts.searchDocument} @@ websearch_to_tsquery('portuguese', ${search})`,
      );
    }

    // AND semantics: every selected tag must be present.
    for (const slug of tagSlugs) {
      conditions.push(
        sql`exists (select 1 from ${postTags} inner join ${tags} on ${tags.id} = ${postTags.tagId} where ${postTags.postId} = ${posts.id} and ${tags.slug} = ${slug})`,
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * The feed stops at the page, then enriches it. A single query joined the
   * page with the author and the counters, and PostgreSQL evaluated the
   * correlated subqueries for every post; `LIMIT` only cut the result.
   */
  async findPage(
    filters: PostFilters,
  ): Promise<{ rows: PostRowWithMeta[]; total: number }> {
    const rows = await this.db
      .select({
        post: posts,
        author: users,
        likesCount: this.likesCountSql,
        commentsCount: this.commentsCountSql,
        likedByMe: this.likedByMeSql(filters.viewerId),
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      // The page is picked before the counters exist: ordering by the
      // correlated subquery (`popular`) made PostgreSQL evaluate it for every
      // post — 5115 of cost against 302 in EXPLAIN, with a sequential scan.
      // `popular` therefore reads the latest page and ranks it in memory.
      .where(this.whereClause(filters))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(filters.limit)
      .offset(filters.offset);

    const ranked =
      filters.sort === 'popular'
        ? [...rows].sort(
            (left, right) =>
              right.likesCount - left.likesCount ||
              right.post.id.localeCompare(left.post.id),
          )
        : rows;

    const [countRow] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(posts)
      .where(this.whereClause(filters));

    return { rows: ranked, total: countRow?.total ?? 0 };
  }

  async findById(
    id: string,
    viewerId: string | null,
  ): Promise<PostRowWithMeta | null> {
    const [row] = await this.db
      .select({
        post: posts,
        author: users,
        likesCount: this.likesCountSql,
        commentsCount: this.commentsCountSql,
        likedByMe: this.likedByMeSql(viewerId),
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    return row ?? null;
  }

  async exists(id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    return Boolean(row);
  }

  async findTagsForPosts(
    postIds: string[],
  ): Promise<Map<string, PostTagRef[]>> {
    const byPost = new Map<string, PostTagRef[]>();
    if (postIds.length === 0) {
      return byPost;
    }

    const rows = await this.db
      .select({
        postId: postTags.postId,
        slug: tags.slug,
        name: tags.name,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(inArray(postTags.postId, postIds))
      .orderBy(asc(tags.name));

    for (const row of rows) {
      const list = byPost.get(row.postId) ?? [];
      list.push({ slug: row.slug, name: row.name });
      byPost.set(row.postId, list);
    }

    return byPost;
  }

  async listTags(): Promise<(PostTagRef & { postCount: number })[]> {
    return this.db
      .select({
        slug: tags.slug,
        name: tags.name,
        postCount: sql<number>`count(${postTags.postId})::int`,
      })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .groupBy(tags.id, tags.slug, tags.name)
      .orderBy(asc(tags.name));
  }

  async insertPost(
    input: CreatePostInput,
    authorId: string,
  ): Promise<PostRow> {
    return this.db.transaction(async (tx) => {
      const [post] = await tx
        .insert(posts)
        .values({
          authorId,
          title: input.title,
          description: input.description,
          content: input.content,
          thumbnailUrl: input.thumbnailUrl?.trim() || null,
        })
        .returning();

      const tagRows = await this.upsertTags(tx, input.tags);
      if (tagRows.length > 0) {
        await tx.insert(postTags).values(
          tagRows.map((tag) => ({ postId: post.id, tagId: tag.id })),
        );
      }

      return post;
    });
  }

  private async upsertTags(
    tx: Transaction,
    names: string[],
  ): Promise<TagRow[]> {
    const unique = new Map<string, string>();

    for (const rawName of names) {
      const name = rawName.trim();
      const slug = slugify(name);
      if (slug && !unique.has(slug)) {
        unique.set(slug, name);
      }
    }

    if (unique.size === 0) {
      return [];
    }

    const values = [...unique].map(([slug, name]) => ({ slug, name }));

    await tx
      .insert(tags)
      .values(values)
      .onConflictDoNothing({ target: tags.slug });

    return tx
      .select()
      .from(tags)
      .where(
        inArray(
          tags.slug,
          values.map((tag) => tag.slug),
        ),
      )
      .orderBy(asc(tags.slug));
  }

  async findComments(
    postId: string,
  ): Promise<{ comment: CommentRow; author: UserRow }[]> {
    return this.db
      .select({ comment: comments, author: users })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt), asc(comments.id));
  }

  async findCommentById(
    postId: string,
    commentId: string,
  ): Promise<{ comment: CommentRow; author: UserRow } | null> {
    const [row] = await this.db
      .select({ comment: comments, author: users })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(and(eq(comments.postId, postId), eq(comments.id, commentId)))
      .limit(1);

    return row ?? null;
  }

  async findComment(
    commentId: string,
  ): Promise<{ comment: CommentRow; author: UserRow } | null> {
    const [row] = await this.db
      .select({ comment: comments, author: users })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    return row ?? null;
  }

  async insertComment(input: {
    postId: string;
    authorId: string;
    body: string;
    parentId: string | null;
  }): Promise<CommentRow> {
    const [created] = await this.db
      .insert(comments)
      .values(input)
      .returning();

    return created;
  }

  async insertLike(postId: string, userId: string): Promise<void> {
    await this.db
      .insert(postLikes)
      .values({ postId, userId })
      .onConflictDoNothing();
  }

  async deleteLike(postId: string, userId: string): Promise<void> {
    await this.db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
  }
}
