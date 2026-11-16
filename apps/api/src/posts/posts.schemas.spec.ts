import { createPostSchema, thumbnailUrlSchema } from './posts.schemas.js';

describe('thumbnailUrlSchema', () => {
  it.each([
    '/seed/feed-01.png',
    'https://cdn.example.com/thumb.webp',
    'http://localhost:5173/seed/feed-02.png',
  ])('accepts %s', (value) => {
    expect(thumbnailUrlSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'file:///etc/passwd',
    'ftp://example.com/a.png',
    '//evil.example.com/a.png',
    '/\\evil.example.com/a.png',
    'seed/feed-01.png',
    'https://exa mple.com/a.png',
  ])('rejects %s', (value) => {
    expect(thumbnailUrlSchema.safeParse(value).success).toBe(false);
  });

  it('treats an empty value as "no thumbnail"', () => {
    expect(thumbnailUrlSchema.safeParse('  ').success).toBe(true);
  });

  it('keeps the thumbnail optional on a post', () => {
    const result = createPostSchema.safeParse({
      title: 'Post',
      description: 'Descrição',
      content: 'code',
    });

    expect(result.success).toBe(true);
  });
});
