import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('signs with the secret from the environment, not the import-time fallback', async () => {
    // Regression: `JWT_SECRET` used to be read at module import time, before
    // `ConfigModule` loaded `.env`, so every token was signed with the public
    // fallback. When the environment defines its own secret, the fallback must
    // not verify a token issued by this API.
    if (!process.env.JWT_SECRET) {
      return;
    }

    const token = await moduleFixture
      .get(JwtService)
      .signAsync({ sub: 'user-1', email: 'ada@example.com' });

    const fallback = new JwtService({ secret: 'dev-only-insecure-secret' });
    expect(() => fallback.verify(token)).toThrow();
  });

  afterEach(async () => {
    await app.close();
  });
});
