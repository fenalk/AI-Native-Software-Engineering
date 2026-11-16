import { z } from 'zod';

export const postIdSchema = z.uuid();

export const commentIdSchema = z.uuid();

export const listPostsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe('Full-text search over title, description and content.'),
  tags: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe('Comma-separated tag slugs; the post must have all of them.'),
  sort: z
    .enum(['recent', 'popular'])
    .default('recent')
    .describe('`recent` orders by date, `popular` by likes.'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

/**
 * Thumbnails end up in `<img src>`, so only two shapes are accepted: an
 * absolute `http(s)` URL or a root-relative path served by the web app
 * (`/seed/feed-01.png`). Anything else — `javascript:`, `data:`, `file:`,
 * protocol-relative `//host` or backslash tricks — is rejected with `400`.
 */
export const thumbnailUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(isSafeThumbnailUrl, {
    message: 'Must be an http(s) URL or a root-relative path',
  });

function isSafeThumbnailUrl(value: string): boolean {
  // An empty value means "no thumbnail" and is stored as `null`.
  if (value === '') {
    return true;
  }
  if (/[\s\\]/.test(value)) {
    return false;
  }
  if (value.startsWith('/')) {
    return !value.startsWith('//');
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(280),
  content: z.string().min(1).max(20000),
  thumbnailUrl: thumbnailUrlSchema.optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(5).default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
