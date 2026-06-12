import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { App } from 'supertest/types';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import { loginAsAdmin } from './helpers/pos-flow';

describe('OpenAPI contract (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('documento OpenAPI incluye paths auth, sales y billing', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('FactoFarm API').setVersion('1.0').build(),
    );
    const paths = Object.keys(document.paths ?? {});
    expect(paths.some((p) => p.includes('/auth/login'))).toBe(true);
    expect(paths.some((p) => p.includes('/sales'))).toBe(true);
    expect(paths.some((p) => p.includes('/billing/sales'))).toBe(true);
  });

  it('POST /auth/login cumple schema mínimo de respuesta', async () => {
    const auth = await loginAsAdmin(app);
    expect(auth.token).toEqual(expect.any(String));
    expect(auth.userId).toEqual(expect.any(String));
    expect(auth.establishmentId).toEqual(expect.any(String));
  });
});
