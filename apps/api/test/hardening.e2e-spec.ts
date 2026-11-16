import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { AUTH_RATE_LIMIT } from './../src/common/rate-limit.js';
import { setupSwagger } from './../src/swagger.js';

describe('HTTP hardening (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    setupSwagger(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sends the helmet security headers', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });

  it('still serves the Swagger UI under the CSP', async () => {
    await request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect('Content-Type', /text\/html/);
  });

  it('rejects a body over the limit with 413 problem details', async () => {
    const response = await request(app.getHttpServer())
      .post('/sessions')
      .send({ email: 'ada@example.com', password: 'x'.repeat(150 * 1024) })
      .expect(413)
      .expect('Content-Type', /application\/problem\+json/);

    expect(response.body).toMatchObject({
      status: 413,
      title: 'Payload Too Large',
    });
  });

  it('throttles sign-in attempts with 429 and Retry-After', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/sessions')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });

    for (let i = 0; i < AUTH_RATE_LIMIT.limit; i++) {
      await attempt().expect(401);
    }

    const blocked = await attempt()
      .expect(429)
      .expect('Content-Type', /application\/problem\+json/);

    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect(blocked.body).toMatchObject({
      status: 429,
      title: 'Too Many Requests',
      instance: '/sessions',
    });
  });

  it('throttles sign-up attempts', async () => {
    const signUp = (i: number) =>
      request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Bot', email: `bot${i}@example.com`, password: 'short' });

    for (let i = 0; i < AUTH_RATE_LIMIT.limit; i++) {
      await signUp(i).expect(400);
    }

    await signUp(AUTH_RATE_LIMIT.limit).expect(429);
  });
});
