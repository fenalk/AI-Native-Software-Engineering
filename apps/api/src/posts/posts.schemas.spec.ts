import {
  commentIdSchema,
  createPostSchema,
  listPostsQuerySchema,
  MAX_PAGE,
  postIdSchema,
} from './posts.schemas.js';

const validPost = {
  title: 'Título',
  description: 'Descrição',
  content: 'const x = 1',
  tags: ['React'],
};

function createPost(overrides: Record<string, unknown> = {}) {
  return createPostSchema.safeParse({ ...validPost, ...overrides });
}

describe('createPostSchema thumbnailUrl', () => {
  it.each([
    '/seed/feed-01.png',
    '/seed/nested/feed.webp',
    'https://images.example.com/cover.png',
  ])('accepts %s', (thumbnailUrl) => {
    expect(createPost(thumbnailUrl ? { thumbnailUrl } : {}).success).toBe(
      true,
    );
  });

  it('accepts a missing thumbnail', () => {
    expect(createPost().success).toBe(true);
  });

  it.each([
    ['javascript:', 'javascript:alert(document.cookie)'],
    ['data:', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='],
    ['http (mixed content)', 'http://images.example.com/cover.png'],
    ['protocol-relative', '//evil.example.com/cover.png'],
    ['file', 'file:///etc/passwd'],
    ['not a URL', 'images.example.com/cover.png'],
    ['backslashes', '/seed\\..\\..\\config'],
    ['control characters', '/seed/feed\u0001.png'],
  ])('rejects %s', (_label, thumbnailUrl) => {
    const result = createPost({ thumbnailUrl });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['thumbnailUrl']);
    }
  });
});

describe('listPostsQuerySchema page', () => {
  it('defaults to the first page', () => {
    expect(listPostsQuerySchema.parse({}).page).toBe(1);
  });

  it('rejects a page above the maximum', () => {
    // A huge OFFSET is paid by the database in full, per anonymous request.
    expect(
      listPostsQuerySchema.safeParse({ page: String(MAX_PAGE + 1) }).success,
    ).toBe(false);
    expect(
      listPostsQuerySchema.safeParse({ page: '10000000' }).success,
    ).toBe(false);
  });
});

describe('id schemas', () => {
  it('uses a dedicated schema per path parameter', () => {
    const id = '9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b';

    expect(postIdSchema.safeParse(id).success).toBe(true);
    expect(commentIdSchema.safeParse(id).success).toBe(true);
    expect(commentIdSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});
