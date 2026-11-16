import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CommentRow, UserRow } from '../db/schema.js';
import { toUsername } from '../users/user.js';
import {
  CommentDto,
  PostAuthorDto,
  PostDetailDto,
  PostListDto,
  PostSummaryDto,
  type PostTagDto,
  TagDto,
} from './post-response.dto.js';
import {
  type PostRowWithMeta,
  type PostTagRef,
  PostsRepository,
} from './posts.repository.js';
import type {
  CreateCommentInput,
  CreatePostInput,
  ListPostsQuery,
} from './posts.schemas.js';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async list(
    query: ListPostsQuery,
    viewerId: string | null,
  ): Promise<PostListDto> {
    const tagSlugs = [
      ...new Set(
        (query.tags ?? '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];

    const { rows, total } = await this.postsRepository.findPage({
      search: query.search || undefined,
      tagSlugs,
      sort: query.sort,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      viewerId,
    });

    const tagsByPost = await this.postsRepository.findTagsForPosts(
      rows.map((row) => row.post.id),
    );

    return {
      items: rows.map((row) =>
        toSummary(row, tagsByPost.get(row.post.id) ?? []),
      ),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async get(id: string, viewerId: string | null): Promise<PostDetailDto> {
    const row = await this.postsRepository.findById(id, viewerId);
    if (!row) {
      throw new NotFoundException('Post not found');
    }

    const tagsByPost = await this.postsRepository.findTagsForPosts([id]);

    return toDetail(row, tagsByPost.get(id) ?? []);
  }

  async create(
    input: CreatePostInput,
    authorId: string,
  ): Promise<PostDetailDto> {
    const created = await this.postsRepository.insertPost(input, authorId);
    return this.get(created.id, authorId);
  }

  async like(postId: string, userId: string): Promise<void> {
    await this.assertPostExists(postId);
    await this.postsRepository.insertLike(postId, userId);
  }

  async unlike(postId: string, userId: string): Promise<void> {
    await this.assertPostExists(postId);
    await this.postsRepository.deleteLike(postId, userId);
  }

  async listComments(postId: string): Promise<CommentDto[]> {
    await this.assertPostExists(postId);

    const rows = await this.postsRepository.findComments(postId);
    return rows.map((row) => toComment(row.comment, row.author));
  }

  async createComment(
    postId: string,
    input: CreateCommentInput,
    authorId: string,
  ): Promise<CommentDto> {
    await this.assertPostExists(postId);

    let parentId: string | null = null;

    if (input.parentId) {
      const parent = await this.postsRepository.findComment(input.parentId);

      if (!parent || parent.comment.postId !== postId) {
        throw new BadRequestException(
          'Parent comment does not belong to this post',
        );
      }

      // Only one level of replies: replying to a reply attaches to its parent.
      parentId = parent.comment.parentId ?? parent.comment.id;
    }

    const created = await this.postsRepository.insertComment({
      postId,
      authorId,
      body: input.body,
      parentId,
    });

    const row = await this.postsRepository.findCommentById(postId, created.id);
    if (!row) {
      throw new NotFoundException('Comment not found');
    }

    return toComment(row.comment, row.author);
  }

  async getComment(postId: string, commentId: string): Promise<CommentDto> {
    const row = await this.postsRepository.findCommentById(postId, commentId);
    if (!row) {
      throw new NotFoundException('Comment not found');
    }

    return toComment(row.comment, row.author);
  }

  async listTags(): Promise<TagDto[]> {
    return this.postsRepository.listTags();
  }

  private async assertPostExists(postId: string): Promise<void> {
    const exists = await this.postsRepository.exists(postId);
    if (!exists) {
      throw new NotFoundException('Post not found');
    }
  }
}

function toAuthor(author: UserRow): PostAuthorDto {
  return {
    id: author.id,
    name: author.name,
    username: toUsername(author.username, author.name, author.id),
    avatarUrl: author.avatarUrl ?? null,
  };
}

function toTags(tagRows: PostTagRef[]): PostTagDto[] {
  return tagRows.map((tag) => ({ slug: tag.slug, name: tag.name }));
}

function toSummary(
  row: PostRowWithMeta,
  tagRows: PostTagRef[],
): PostSummaryDto {
  return {
    id: row.post.id,
    title: row.post.title,
    description: row.post.description,
    thumbnailUrl: row.post.thumbnailUrl ?? null,
    author: toAuthor(row.author),
    tags: toTags(tagRows),
    likesCount: Number(row.likesCount ?? 0),
    commentsCount: Number(row.commentsCount ?? 0),
    likedByMe: Boolean(row.likedByMe),
    createdAt: row.post.createdAt,
  };
}

function toDetail(
  row: PostRowWithMeta,
  tagRows: PostTagRef[],
): PostDetailDto {
  const summary = toSummary(row, tagRows);

  return {
    id: summary.id,
    title: summary.title,
    description: summary.description,
    thumbnailUrl: summary.thumbnailUrl,
    author: summary.author,
    tags: summary.tags,
    likesCount: summary.likesCount,
    commentsCount: summary.commentsCount,
    likedByMe: summary.likedByMe,
    createdAt: summary.createdAt,
    content: row.post.content,
  };
}

function toComment(comment: CommentRow, author: UserRow): CommentDto {
  return {
    id: comment.id,
    body: comment.body,
    parentId: comment.parentId ?? null,
    author: toAuthor(author),
    createdAt: comment.createdAt,
  };
}
