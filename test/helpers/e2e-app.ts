import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

export async function createE2eApp(): Promise<INestApplication<App>> {
  const { Test } = await import('@nestjs/testing');
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('FactoFarm API').setVersion('1.0').build(),
  );
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/openapi.json', (_req: unknown, res: unknown) => {
    httpAdapter.reply(res, document, 200);
  });

  return app;
}

export async function closeE2eApp(app: INestApplication<App>): Promise<void> {
  await app.close();
}

export const DEMO_ADMIN = {
  email: 'admin@factosysperu.com',
  password: 'Admin123!',
} as const;
