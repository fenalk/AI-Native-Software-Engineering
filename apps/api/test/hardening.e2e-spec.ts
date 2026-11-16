import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';

/**
 * HTTP hardening: `configureApp` is the same function `main.ts` runs, so these
 * assertions describe the deployed surface, not a test-only setup.
 */
describe('HTTP hardening (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('does not advertise the server stack', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('sets the helmet security headers', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['strict-transport-security']).toContain(
      'max-age=',
    );
  });

  it('rejects a body above the declared limit with a problem details 413', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'x'.repeat(200 * 1024),
      })
      .expect(413)
      .expect('Content-Type', /application\/problem\+json/);

    expect(response.body).toMatchObject({
      status: 413,
      title: 'Payload Too Large',
    });
  });

  it('keeps the API reachable under the global rate limit', async () => {
    // The throttler is a guard, so a wrong registration order would answer 429
    // to normal traffic. 20 reads stay far below the global 120/min ceiling.
    for (let read = 0; read < 20; read += 1) {
      await request(app.getHttpServer()).get('/tags').expect(200);
    }
  });

  it('caps repeated sign-in attempts with a 429 problem and Retry-After', async () => {
    // The auth limiter allows 10 requests per minute per client.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ email: 'nobody@example.com', password: 'wrong-password' })
        .expect(401);
    }

    const blocked = await request(app.getHttpServer())
      .post('/sessions')
      .send({ email: 'nobody@example.com', password: 'wrong-password' })
      .expect(429)
      .expect('Content-Type', /application\/problem\+json/);

    expect(blocked.headers['retry-after']).toMatch(/^\d+$/);
    expect(blocked.body).toMatchObject({
      status: 429,
      title: 'Too Many Requests',
      instance: '/sessions',
    });
  });
});
