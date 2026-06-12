import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

/** URL base para logs y enlaces humanos (evita `http://[::1]:…` que confunde en Windows). */
function localBrowserBase(port: number): string {
  return `http://localhost:${port}`;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({ origin: true });

  const openApiConfig = new DocumentBuilder()
    .setTitle('FactoFarm API')
    .setDescription(
      'API REST del backend FactoFarm (usuarios, establecimientos). Documentación generada con OpenAPI y Scalar.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('app', 'Estado del servicio')
    .addTag('auth', 'Autenticación')
    .addTag('users', 'Usuarios')
    .addTag('establishments', 'Establecimientos')
    .addTag('customer-types', 'Tipos de cliente')
    .addTag('customers', 'Clientes')
    .addTag('products', 'Productos')
    .addTag('permissions', 'Permisos')
    .addTag('files', 'Archivos')
    .build();

  const document = SwaggerModule.createDocument(app, openApiConfig);

  app.use(
    '/api/v1/docs',
    apiReference({
      theme: 'purple',
      content: document,
    }),
  );

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/openapi.json', (_req, res) => {
    httpAdapter.reply(res, document, 200);
  });

  const appService = app.get(AppService);
  httpAdapter.get('/api/health', async (_req, res) => {
    const health = await appService.getHealth();
    const status = health.database === 'connected' ? 200 : 503;
    httpAdapter.reply(res, health, status);
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  const logger = app.get(Logger);
  const bound = await app.getUrl();
  const browse = localBrowserBase(port);

  logger.log(
    `FactoFarm API · escucha ${host}:${port} (interno Nest: ${bound}) · prefijo /api/v1`,
  );
  logger.log(
    `Abrir en el navegador: ${browse}/api/health · Docs: ${browse}/api/v1/docs · OpenAPI: ${browse}/api/v1/openapi.json`,
  );
}

bootstrap();
