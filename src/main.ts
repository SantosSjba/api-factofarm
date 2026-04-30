import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

/** URL base para logs y enlaces humanos (evita `http://[::1]:…` que confunde en Windows). */
function localBrowserBase(port: number): string {
  return `http://localhost:${port}`;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
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
    '/api/docs',
    apiReference({
      theme: 'purple',
      content: document,
    }),
  );

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/openapi.json', (_req, res) => {
    httpAdapter.reply(res, document, 200);
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  const logger = new Logger('Bootstrap');
  const bound = await app.getUrl();
  const browse = localBrowserBase(port);

  logger.log(
    `FactoFarm API · escucha ${host}:${port} (interno Nest: ${bound}) · prefijo /api`,
  );
  logger.log(
    `Abrir en el navegador: ${browse}/api/health · Docs: ${browse}/api/docs · OpenAPI: ${browse}/api/openapi.json`,
  );
}

bootstrap();
