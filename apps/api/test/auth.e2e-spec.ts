import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDrizzleToken } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import type { Database } from './../src/db/database.js';
import { AppModule } from './../src/app.module.js';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  const ada = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'senha-segura',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // The suite runs against a dedicated database (see `test/database.ts`),
    // and every test starts from an empty `users` table.
    await moduleFixture
      .get<Database>(getDrizzleToken())
      .execute(sql`TRUNCATE TABLE users, tags CASCADE`);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('registers a user and points Location at it', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(ada)
        .expect(201);

      expect(response.headers.location).toMatch(/^\/users\/[\w-]+$/);
      expect(response.body).toMatchObject({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('rejects a registered email with a problem details body', async () => {
      await request(app.getHttpServer()).post('/users').send(ada).expect(201);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ ...ada, name: 'Ada again' })
        .expect(409)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body).toMatchObject({
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: 'Email already registered',
        instance: '/users',
      });
    });

    it('rejects an invalid payload with one issue per property', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: '', email: 'not-an-email', password: 'short' })
        .expect(400)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body).toMatchObject({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        instance: '/users',
      });
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'name' }),
          expect.objectContaining({ path: 'email' }),
          expect.objectContaining({ path: 'password' }),
        ]),
      );
    });
  });

  describe('POST /sessions', () => {
    it('signs in with valid credentials', async () => {
      await request(app.getHttpServer()).post('/users').send(ada).expect(201);

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .send({ email: 'ADA@example.com', password: ada.password })
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    });

    it('rejects invalid credentials with 401', async () => {
      await request(app.getHttpServer()).post('/users').send(ada).expect(201);

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .send({ email: ada.email, password: 'wrong-password' })
        .expect(401)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body).toMatchObject({
        status: 401,
        title: 'Unauthorized',
        instance: '/sessions',
      });
    });
  });

  describe('GET /users/me', () => {
    it('rejects a request without a token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .expect(401)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body).toMatchObject({
        status: 401,
        instance: '/users/me',
      });
    });

    it('rejects an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
    });

    it('returns the signed-in user', async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .send(ada)
        .expect(201);

      const session = await request(app.getHttpServer())
        .post('/sessions')
        .send({ email: ada.email, password: ada.password })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${session.body.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: created.body.id,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        username: 'ada-lovelace',
        avatarUrl: null,
        createdAt: created.body.createdAt,
      });
    });
  });
});
