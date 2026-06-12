import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import { loginAsAdmin, resolvePosContext, runPosSaleFlow, ensureOpenCashSession } from './helpers/pos-flow';

describe('POS flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('login → venta → comprobante → cierre caja', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const { sale, cpe, close } = await runPosSaleFlow(app, ctx);

    expect(sale.body.id).toBeDefined();
    expect(cpe.body.sunatStatus).toBe('ACEPTADO');
    expect(close.body.ok).toBe(true);
  }, 60_000);

  it('registra 20 ventas concurrentes sin error 5xx', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = { Authorization: `Bearer ${ctx.token}` };

    const session = await ensureOpenCashSession(app, ctx);

    const workers = Array.from({ length: 20 }, () =>
      request(app.getHttpServer())
        .post('/api/v1/sales')
        .set(bearer)
        .set('Idempotency-Key', randomUUID())
        .send({
          warehouseId: ctx.warehouseId,
          cashSessionId: session.id,
          documentType: 'BOLETA',
          items: [{ productId: ctx.productId, quantity: 1 }],
          payments: [{ metodo: 'EFECTIVO', monto: ctx.productPrice }],
        }),
    );

    const responses = await Promise.all(workers);
    expect(responses.every((r) => r.status < 500)).toBe(true);
    expect(responses.filter((r) => r.status === 201).length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
      .set(bearer)
      .send({
        montoCierreFisico: ctx.productPrice * responses.filter((r) => r.status === 201).length,
      })
      .expect(201);
  }, 120_000);
});
