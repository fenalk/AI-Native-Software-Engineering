import { z } from 'zod';

/**
 * URLs supplied by clients end up in `src`/`href` attributes, so only two
 * shapes are accepted: an absolute `https` URL, or a path relative to the root
 * (`/seed/...`). `javascript:`, `data:`, `http:` (mixed content) and
 * protocol-relative `//host` are rejected.
 */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(isServableImageUrl, {
    message:
      'Must be an absolute https URL or a path starting with a single "/".',
  });

function isServableImageUrl(value: string): boolean {
  if (value.startsWith('//')) {
    return false;
  }

  if (value.startsWith('/')) {
    // Root-relative path: no scheme, no backslashes, control characters or
    // whitespace, which is what URL parsing would otherwise normalize away.
    const hasControlCharacter = Array.from(value).some(
      (character) => character.charCodeAt(0) < 0x20,
    );

    return (
      !hasControlCharacter &&
      !value.includes('\\') &&
      !/\s/.test(value) &&
      !value.startsWith('/\\')
    );
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** Maximum `page` accepted by the feed; keeps `OFFSET` bounded. */
export const MAX_PAGE = 1000;

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
  // Without an upper bound a single anonymous request could ask for a huge
  // `OFFSET`, which the database pays for in full.
  page: z.coerce.number().int().min(1).max(MAX_PAGE).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(280),
  content: z.string().min(1).max(20000),
  thumbnailUrl: imageUrlSchema.optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(5).default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
