import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CommentRow, PostRow, UserRow } from '../db/schema.js';
import { PostsRepository } from './posts.repository.js';
import { PostsService } from './posts.service.js';

const author: UserRow = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Julio',
  email: 'julio@example.com',
  passwordHash: 'hash',
  username: 'julio',
  avatarUrl: '/seed/julio.png',
  createdAt: new Date('2026-11-16T12:00:00.000Z'),
};

const post: PostRow = {
  id: '22222222-2222-4222-8222-222222222222',
  authorId: author.id,
  title: 'Design system',
  description: 'Descrição',
  content: 'const x = 1',
  thumbnailUrl: null,
  searchDocument: '',
  createdAt: new Date('2026-11-16T12:00:00.000Z'),
};

function postWithMeta(overrides: Partial<PostRow> = {}) {
  return {
    post: { ...post, ...overrides },
    author,
    likesCount: 3,
    commentsCount: 2,
    likedByMe: false,
  };
}

function commentRow(overrides: Partial<CommentRow> = {}): CommentRow {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    postId: post.id,
    authorId: author.id,
    parentId: null,
    body: 'Comentário',
    createdAt: new Date('2026-11-16T13:00:00.000Z'),
    ...overrides,
  };
}

describe('PostsService', () => {
  let postsService: PostsService;
  let postsRepository: {
    findPage: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findTagsForPosts: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    listTags: ReturnType<typeof vi.fn>;
    insertPost: ReturnType<typeof vi.fn>;
    insertLike: ReturnType<typeof vi.fn>;
    deleteLike: ReturnType<typeof vi.fn>;
    findComments: ReturnType<typeof vi.fn>;
    findCommentById: ReturnType<typeof vi.fn>;
    findComment: ReturnType<typeof vi.fn>;
    insertComment: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    postsRepository = {
      findPage: vi.fn(),
      findById: vi.fn(),
      findTagsForPosts: vi.fn(),
      exists: vi.fn(),
      listTags: vi.fn(),
      insertPost: vi.fn(),
      insertLike: vi.fn(),
      deleteLike: vi.fn(),
      findComments: vi.fn(),
      findCommentById: vi.fn(),
      findComment: vi.fn(),
      insertComment: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PostsRepository, useValue: postsRepository },
      ],
    }).compile();

    postsService = moduleRef.get(PostsService);
  });

  it('lists posts, parsing tags and mapping the author handle', async () => {
    postsRepository.findPage.mockResolvedValue({
      rows: [postWithMeta()],
      total: 1,
    });
    postsRepository.findTagsForPosts.mockResolvedValue(
      new Map([[post.id, [{ slug: 'react', name: 'React' }]]]),
    );

    const result = await postsService.list(
      {
        search: 'design',
        tags: 'react, front-end,react',
        sort: 'recent',
        page: 1,
        limit: 12,
      },
      null,
    );

    expect(postsRepository.findPage).toHaveBeenCalledWith({
      search: 'design',
      tagSlugs: ['react', 'front-end'],
      sort: 'recent',
      limit: 12,
      offset: 0,
      viewerId: null,
    });
    expect(result).toMatchObject({
      page: 1,
      limit: 12,
      total: 1,
      items: [
        {
          id: post.id,
          tags: [{ slug: 'react', name: 'React' }],
          likesCount: 3,
          commentsCount: 2,
          likedByMe: false,
          author: { username: 'julio' },
        },
      ],
    });
  });

  it('throws 404 when the post does not exist', async () => {
    postsRepository.findById.mockResolvedValue(null);

    await expect(postsService.get(post.id, null)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a post and returns its detail', async () => {
    postsRepository.insertPost.mockResolvedValue(post);
    postsRepository.findById.mockResolvedValue(postWithMeta());
    postsRepository.findTagsForPosts.mockResolvedValue(new Map());

    const input = {
      title: post.title,
      description: post.description,
      content: post.content,
      tags: ['react'],
    };

    const result = await postsService.create(input, author.id);

    expect(postsRepository.insertPost).toHaveBeenCalledWith(input, author.id);
    expect(result).toMatchObject({ id: post.id, content: post.content });
  });

  it('likes an existing post and removes the like idempotently', async () => {
    postsRepository.exists.mockResolvedValue(true);

    await postsService.like(post.id, author.id);
    await postsService.unlike(post.id, author.id);

    expect(postsRepository.insertLike).toHaveBeenCalledWith(post.id, author.id);
    expect(postsRepository.deleteLike).toHaveBeenCalledWith(post.id, author.id);
  });

  it('refuses to like a missing post', async () => {
    postsRepository.exists.mockResolvedValue(false);

    await expect(postsService.like(post.id, author.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(postsRepository.insertLike).not.toHaveBeenCalled();
  });

  it('creates a reply and attaches it to the top-level comment', async () => {
    postsRepository.exists.mockResolvedValue(true);
    const top = commentRow();
    const reply = commentRow({
      id: '44444444-4444-4444-8444-444444444444',
      parentId: top.id,
    });
    postsRepository.findComment.mockResolvedValue({ comment: reply, author });
    postsRepository.insertComment.mockResolvedValue(reply);
    postsRepository.findCommentById.mockResolvedValue({
      comment: reply,
      author,
    });

    const result = await postsService.createComment(
      post.id,
      { body: 'Resposta', parentId: reply.id },
      author.id,
    );

    expect(postsRepository.insertComment).toHaveBeenCalledWith({
      postId: post.id,
      authorId: author.id,
      body: 'Resposta',
      parentId: top.id,
    });
    expect(result.parentId).toBe(top.id);
  });

  it('rejects a parent comment from another post', async () => {
    postsRepository.exists.mockResolvedValue(true);
    postsRepository.findComment.mockResolvedValue({
      comment: commentRow({ postId: '55555555-5555-4555-8555-555555555555' }),
      author,
    });

    await expect(
      postsService.createComment(
        post.id,
        { body: 'Resposta', parentId: commentRow().id },
        author.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
