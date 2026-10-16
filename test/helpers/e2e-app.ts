import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { createValidationPipe } from '../../src/common/validation/validation-pipe.factory';

export async function createE2eApp(): Promise<INestApplication<App>> {
  const { Test } = await import('@nestjs/testing');
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(createValidationPipe());
  await app.init();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('FactoFarm API').setVersion('1.0').build(),
  );
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/openapi.json', (_req: unknown, res: unknown) => {
    httpAdapter.reply(res, document, 200);
  });

  // Un solo servidor por aplicación: Supertest no debe abrir/cerrar puertos
  // durante peticiones concurrentes del mismo flujo.
  await app.listen(0, '127.0.0.1');
  return app;
}

export async function closeE2eApp(app: INestApplication<App>): Promise<void> {
  await app.close();
}

export const DEMO_ADMIN = {
  email: 'admin@factosysperu.com',
  password: 'Admin123!',
} as const;
