import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDrizzleToken } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import type { Database } from './../src/db/database.js';
import { AppModule } from './../src/app.module.js';

describe('Posts (e2e)', () => {
  let app: INestApplication<App>;

  const password = 'senha-segura';
  const author = {
    name: 'Julio',
    email: 'julio@example.com',
    password,
  };

  let token = '';

  const post = {
    title: 'Acessibilidade na prática',
    description: 'Contraste, foco visível e navegação por teclado.',
    content: 'export const accessible = true;',
    thumbnailUrl: '/seed/feed-01.png',
    tags: ['React', 'Front-end'],
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await moduleFixture
      .get<Database>(getDrizzleToken())
      .execute(sql`TRUNCATE TABLE users, tags CASCADE`);

    await request(app.getHttpServer())
      .post('/users')
      .send(author)
      .expect(201);

    const session = await request(app.getHttpServer())
      .post('/sessions')
      .send({ email: author.email, password })
      .expect(200);

    token = session.body.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  async function createPost(overrides: Partial<typeof post> = {}) {
    const response = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...post, ...overrides })
      .expect(201);

    return response;
  }

  describe('GET /posts', () => {
    it('returns a public page of posts with tags and author', async () => {
      await createPost();

      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(response.body).toMatchObject({
        page: 1,
        limit: 12,
        total: 1,
      });
      expect(response.body.items[0]).toMatchObject({
        title: post.title,
        thumbnailUrl: post.thumbnailUrl,
        likesCount: 0,
        commentsCount: 0,
        likedByMe: false,
        author: { username: 'julio' },
      });
      expect(response.body.items[0].tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ slug: 'react', name: 'React' }),
          expect.objectContaining({ slug: 'front-end', name: 'Front-end' }),
        ]),
      );
    });

    it('searches with PostgreSQL full-text search', async () => {
      await createPost();
      await createPost({
        title: 'CSS moderno',
        description: 'Grid e container queries',
        content: 'display: grid',
        tags: ['CSS'],
      });

      const found = await request(app.getHttpServer())
        .get('/posts')
        .query({ search: 'acessibilidade' })
        .expect(200);
      expect(found.body.total).toBe(1);
      expect(found.body.items[0].title).toBe(post.title);

      const missing = await request(app.getHttpServer())
        .get('/posts')
        .query({ search: 'kubernetes' })
        .expect(200);
      expect(missing.body.total).toBe(0);
    });

    it('filters by all selected tags', async () => {
      await createPost();
      await createPost({
        title: 'Design',
        description: 'Outro post',
        content: 'content',
        tags: ['React', 'Design'],
      });

      const both = await request(app.getHttpServer())
        .get('/posts')
        .query({ tags: 'react,front-end' })
        .expect(200);
      expect(both.body.total).toBe(1);

      const impossible = await request(app.getHttpServer())
        .get('/posts')
        .query({ tags: 'react,css' })
        .expect(200);
      expect(impossible.body.total).toBe(0);
    });

    it('rejects invalid pagination', async () => {
      await request(app.getHttpServer())
        .get('/posts')
        .query({ limit: 999 })
        .expect(400)
        .expect('Content-Type', /application\/problem\+json/);
    });
  });

  describe('GET /posts/:id', () => {
    it('returns the post with its code', async () => {
      const created = await createPost();

      const response = await request(app.getHttpServer())
        .get(`/posts/${created.body.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.body.id,
        content: post.content,
      });
    });

    it('returns 404 for an unknown post', async () => {
      await request(app.getHttpServer())
        .get('/posts/9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b')
        .expect(404)
        .expect('Content-Type', /application\/problem\+json/);
    });
  });

  describe('POST /posts', () => {
    it('requires a session', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send(post)
        .expect(401)
        .expect('Content-Type', /application\/problem\+json/);
    });

    it('creates the post, points Location at it and upserts tags', async () => {
      const response = await createPost();

      expect(response.headers.location).toBe(`/posts/${response.body.id}`);
      expect(response.body).toMatchObject({
        title: post.title,
        content: post.content,
        author: { username: 'julio' },
      });
      expect(response.body.tags).toHaveLength(2);

      const tags = await request(app.getHttpServer())
        .get('/tags')
        .expect(200);
      expect(tags.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ slug: 'react', postCount: 1 }),
          expect.objectContaining({ slug: 'front-end', postCount: 1 }),
        ]),
      );
    });

    it.each(['javascript:alert(1)', 'data:image/png;base64,AAAA', '//evil.example.com/a.png'])(
      'rejects the unsafe thumbnail %s',
      async (thumbnailUrl) => {
        const response = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...post, thumbnailUrl })
          .expect(400)
          .expect('Content-Type', /application\/problem\+json/);

        expect(response.body.errors).toEqual([
          expect.objectContaining({ path: 'thumbnailUrl' }),
        ]);
      },
    );

    it('rejects an invalid payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '', description: '', content: '', tags: [] })
        .expect(400)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'title' }),
          expect.objectContaining({ path: 'description' }),
          expect.objectContaining({ path: 'content' }),
        ]),
      );
    });
  });

  describe('likes', () => {
    it('likes idempotently and reports likedByMe to the owner', async () => {
      const created = await createPost();
      const id = created.body.id;

      await request(app.getHttpServer())
        .post(`/posts/${id}/likes`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
      await request(app.getHttpServer())
        .post(`/posts/${id}/likes`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const liked = await request(app.getHttpServer())
        .get(`/posts/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(liked.body).toMatchObject({ likesCount: 1, likedByMe: true });

      const anonymous = await request(app.getHttpServer())
        .get(`/posts/${id}`)
        .expect(200);
      expect(anonymous.body).toMatchObject({
        likesCount: 1,
        likedByMe: false,
      });

      await request(app.getHttpServer())
        .delete(`/posts/${id}/likes`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const unliked = await request(app.getHttpServer())
        .get(`/posts/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(unliked.body).toMatchObject({ likesCount: 0, likedByMe: false });
    });

    it('requires a session', async () => {
      const created = await createPost();

      await request(app.getHttpServer())
        .post(`/posts/${created.body.id}/likes`)
        .expect(401);
    });

    it('returns 404 for an unknown post', async () => {
      await request(app.getHttpServer())
        .post('/posts/9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b/likes')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('comments', () => {
    it('creates a comment and a one-level reply', async () => {
      const created = await createPost();
      const id = created.body.id;

      const comment = await request(app.getHttpServer())
        .post(`/posts/${id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Muito bom!' })
        .expect(201);

      expect(comment.headers.location).toBe(
        `/posts/${id}/comments/${comment.body.id}`,
      );
      expect(comment.body).toMatchObject({
        body: 'Muito bom!',
        parentId: null,
        author: { username: 'julio' },
      });

      const reply = await request(app.getHttpServer())
        .post(`/posts/${id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Valeu!', parentId: comment.body.id })
        .expect(201);

      expect(reply.body.parentId).toBe(comment.body.id);

      const list = await request(app.getHttpServer())
        .get(`/posts/${id}/comments`)
        .expect(200);
      expect(list.body).toHaveLength(2);
      expect(list.body[1]).toMatchObject({
        body: 'Valeu!',
        parentId: comment.body.id,
      });

      const detail = await request(app.getHttpServer())
        .get(`/posts/${id}`)
        .expect(200);
      expect(detail.body.commentsCount).toBe(2);
    });

    it('normalizes a reply to a reply to its top-level parent', async () => {
      const created = await createPost();
      const id = created.body.id;

      const top = await request(app.getHttpServer())
        .post(`/posts/${id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Top' })
        .expect(201);

      const reply = await request(app.getHttpServer())
        .post(`/posts/${id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Reply', parentId: top.body.id })
        .expect(201);

      const replyToReply = await request(app.getHttpServer())
        .post(`/posts/${id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Reply to reply', parentId: reply.body.id })
        .expect(201);

      expect(replyToReply.body.parentId).toBe(top.body.id);
    });

    it('reads the comment the Location header points at', async () => {
      const created = await createPost();
      const id = created.body.id;

      const comment = await request(app.getHttpServer())
        .post(`/posts/${id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Muito bom!' })
        .expect(201);

      const read = await request(app.getHttpServer())
        .get(comment.headers.location)
        .expect(200);
      expect(read.body).toMatchObject({ id: comment.body.id, body: 'Muito bom!' });
    });

    it('returns 404 when the comment belongs to another post', async () => {
      const first = await createPost();
      const second = await createPost({ title: 'Outro post' });

      const comment = await request(app.getHttpServer())
        .post(`/posts/${first.body.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'No primeiro post' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/posts/${second.body.id}/comments/${comment.body.id}`)
        .expect(404)
        .expect('Content-Type', /application\/problem\+json/);
    });

    it('rejects a malformed comment id with 400', async () => {
      const created = await createPost();

      await request(app.getHttpServer())
        .get(`/posts/${created.body.id}/comments/not-a-uuid`)
        .expect(400)
        .expect('Content-Type', /application\/problem\+json/);
    });

    it('requires a session', async () => {
      const created = await createPost();

      await request(app.getHttpServer())
        .post(`/posts/${created.body.id}/comments`)
        .send({ body: 'Sem sessão' })
        .expect(401);
    });
  });

  describe('GET /tags', () => {
    it('lists tags with their post counts', async () => {
      await createPost();

      const response = await request(app.getHttpServer())
        .get('/tags')
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          { slug: 'front-end', name: 'Front-end', postCount: 1 },
          { slug: 'react', name: 'React', postCount: 1 },
        ]),
      );
    });
  });
});
