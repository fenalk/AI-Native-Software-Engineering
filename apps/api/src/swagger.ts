import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProblemDetailsDto } from './common/problem-details.dto.js';

/** Mount path of the Swagger UI; the JSON document is served at `/docs-json`. */
export const SWAGGER_PATH = 'docs';

/** Builds and serves the OpenAPI document, with Bearer authentication enabled. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AI-Native Software Engineering API')
    .setDescription(
      'Users and JWT authentication for the course sandbox. Data lives in memory and is lost when the API restarts.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Access token returned by `POST /sessions`.',
    })
    .build();

  // `ProblemDetailsDto` is referenced only inside response `content`, which the
  // document builder does not scan, so it must be declared as an extra model.
  const options = { extraModels: [ProblemDetailsDto] };

  // Defer building the document until it is first requested.
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup(SWAGGER_PATH, app, documentFactory);
}
