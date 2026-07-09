import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { parseCorsOrigins } from './config/env.validation';

function localBrowserBase(port: number): string {
  return `http://localhost:${port}`;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.set('trust proxy', 1);
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

  app.use(
    helmet({
      contentSecurityPolicy: config.get('NODE_ENV') === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());

  const corsOrigins = parseCorsOrigins(
    config.get<string>('FRONTEND_URL', 'http://localhost:4200'),
    config.get<string>('CORS_ORIGINS'),
  );
  app.enableCors({
    origin:
      config.get('NODE_ENV') === 'production'
        ? corsOrigins
        : (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
  });

  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const swaggerEnabled =
    config.get<boolean>('SWAGGER_ENABLED') ?? nodeEnv !== 'production';
  if (swaggerEnabled) {
    const openApiConfig = new DocumentBuilder()
      .setTitle('FactoFarm API')
      .setDescription(
        'API REST FactoFarm — farmacia Perú (usuarios, POS, inventario, SUNAT, DIGEMID).',
      )
      .setVersion('1.0')
      .addBearerAuth()
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
  }

  const httpAdapter = app.getHttpAdapter();
  const appService = app.get(AppService);
  httpAdapter.get('/api/health', async (_req, res) => {
    const health = await appService.getHealth();
    const status = health.database === 'connected' ? 200 : 503;
    httpAdapter.reply(res, health, status);
  });

  app.enableShutdownHooks();

  const port = Number(config.get('PORT') ?? 3000);
  const host = config.get<string>('HOST') ?? '0.0.0.0';
  await app.listen(port, host);

  const browse = localBrowserBase(port);
  logger.log(`FactoFarm API · ${host}:${port} · prefijo /api/v1`);
  logger.log(`Health: ${browse}/api/health`);
  if (swaggerEnabled) {
    logger.log(`Docs: ${browse}/api/v1/docs`);
  }
}

bootstrap();
