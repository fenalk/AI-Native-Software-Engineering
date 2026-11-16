import { z } from 'zod';

export const postIdSchema = z.uuid();

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

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(280),
  content: z.string().min(1).max(20000),
  thumbnailUrl: z.string().trim().max(2048).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(5).default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
