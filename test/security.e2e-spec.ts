import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import { loginAsAdmin } from './helpers/pos-flow';

const DEMO_CAJERO = {
  email: 'cajero@factosysperu.com',
  password: 'Cajero123!',
} as const;

describe('Security smoke (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('rechaza acceso a ventas sin token', () => {
    return request(app.getHttpServer()).get('/api/v1/sales').expect(401);
  });

  it('rechaza acceso a auditoría sin token', () => {
    return request(app.getHttpServer()).get('/api/v1/audit-logs').expect(401);
  });

  it('rechaza payload inválido en login', () => {
    return request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'bad' }).expect(400);
  });

  it('no expone stack trace en error controlado', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'x@y.com', password: 'short' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.body)).not.toMatch(/node_modules/);
  });

  it('usuario autenticado accede a dashboard stats', async () => {
    const auth = await loginAsAdmin(app);
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${auth.token}`)
      .expect(200);
  });

  it('health ready responde 200 con BD conectada', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('rechaza establishmentId de otra sucursal para rol no admin', async () => {
    const admin = await loginAsAdmin(app);
    const establishmentsRes = await request(app.getHttpServer())
      .get('/api/v1/establishments')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const establishments = Array.isArray(establishmentsRes.body)
      ? establishmentsRes.body
      : establishmentsRes.body.items ?? [];
    const other = establishments.find(
      (e: { id: string }) => e.id !== admin.establishmentId,
    );
    if (!other) {
      return;
    }

    const cajeroLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(DEMO_CAJERO);
    if (cajeroLogin.status !== 200) {
      return;
    }

    await request(app.getHttpServer())
      .get('/api/v1/warehouses')
      .query({ establishmentId: other.id })
      .set('Authorization', `Bearer ${cajeroLogin.body.accessToken}`)
      .expect(403);
  });
});