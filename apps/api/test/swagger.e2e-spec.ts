import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { setupSwagger } from './../src/swagger.js';

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('documents the routes, their schemas and the bearer scheme', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const document = response.body;

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/users',
        '/users/me',
        '/sessions',
        '/posts',
        '/posts/{id}',
        '/posts/{id}/likes',
        '/posts/{id}/comments',
        '/tags',
      ]),
    );

    expect(
      document.paths['/users'].post.requestBody.content['application/json']
        .schema,
    ).toMatchObject({
      type: 'object',
      required: ['name', 'email', 'password'],
    });
    expect(
      document.paths['/users'].post.responses['201'].content['application/json']
        .schema,
    ).toEqual({
      $ref: '#/components/schemas/UserResponseDto',
    });
    expect(
      document.paths['/users'].post.responses['409'].content[
        'application/problem+json'
      ].schema,
    ).toEqual({ $ref: '#/components/schemas/ProblemDetailsDto' });

    expect(
      document.paths['/sessions'].post.responses['200'].content[
        'application/json'
      ].schema,
    ).toEqual({ $ref: '#/components/schemas/AccessTokenResponseDto' });

    expect(document.paths['/users/me'].get.security).toEqual([{ bearer: [] }]);
    expect(document.components.securitySchemes.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });
});
