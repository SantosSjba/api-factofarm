import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

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
    .addTag('app', 'Estado del servicio')
    .addTag('auth', 'Autenticación')
    .addTag('users', 'Usuarios')
    .addTag('establishments', 'Establecimientos')
    .build();

  const document = SwaggerModule.createDocument(app, openApiConfig);

  app.use(
    '/api/docs',
    apiReference({
      theme: 'purple',
      content: document,
    }),
  );

  app
    .getHttpAdapter()
    .get('/api/openapi.json', (_req: Request, res: Response) => {
      res.type('application/json').send(JSON.stringify(document));
    });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
