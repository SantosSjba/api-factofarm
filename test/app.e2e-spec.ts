import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createE2eApp, closeE2eApp, DEMO_ADMIN } from './helpers/e2e-app';

describe('FactoFarm API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('GET /api/v1 returns health message', () => {
    return request(app.getHttpServer()).get('/api/v1').expect(200).expect('FactoFarm API OK');
  });

  it('GET /api/v1/health/ready checks database', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect((res) => {
        expect([200, 503]).toContain(res.status);
      });
  });

  it('POST /api/v1/auth/login rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'no-existe@factofarm.local', password: 'wrong-password-123' })
      .expect(401);
  });

  it('POST /api/v1/auth/login accepts demo admin', () => {
    return request(app.getHttpServer()).post('/api/v1/auth/login').send(DEMO_ADMIN).expect(200);
  });
});
