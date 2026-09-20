import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import { loginAsAdmin, resolvePosContext, runPosSaleFlow, ensureOpenCashSession } from './helpers/pos-flow';

async function readPosStock(
  app: INestApplication<App>,
  bearer: Record<string, string>,
  warehouseId: string,
  productId: string,
): Promise<number> {
  const res = await request(app.getHttpServer())
    .get('/api/v1/sales/pos-catalog')
    .query({ warehouseId, search: '0001' })
    .set(bearer)
    .expect(200);

  const row = (res.body as Array<{ id?: string; stock?: string | number }>).find(
    (p) => p.id === productId,
  );
  if (!row) throw new Error(`Producto ${productId} no aparece en pos-catalog`);
  return Number(row.stock ?? 0);
}

describe('POS flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('login → venta nota → cierre caja', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const { sale, close } = await runPosSaleFlow(app, ctx);

    expect(sale.body.id).toBeDefined();
    expect(sale.body.documentType).toBe('NOTA_VENTA');
    expect(close.body.ok).toBe(true);
  }, 60_000);

  it('venta decrementa stock y anulación (otro usuario) lo restaura', async () => {
    const { loginAsAdminCadena } = await import('./helpers/pos-flow');
    const admin = await loginAsAdmin(app);
    const seller = await loginAsAdminCadena(app);
    const ctx = await resolvePosContext(app, admin);
    const adminBearer = { Authorization: `Bearer ${admin.token}` };
    const sellerBearer = { Authorization: `Bearer ${seller.token}` };

    const stockBefore = await readPosStock(app, adminBearer, ctx.warehouseId, ctx.productId);
    expect(stockBefore).toBeGreaterThanOrEqual(1);

    const session = await ensureOpenCashSession(app, ctx);
    const sale = await request(app.getHttpServer())
      .post('/api/v1/sales')
      .set(sellerBearer)
      .set('Idempotency-Key', randomUUID())
      .send({
        warehouseId: ctx.warehouseId,
        cashSessionId: session.id,
        documentType: 'NOTA_VENTA',
        items: [{ productId: ctx.productId, quantity: 1 }],
        payments: [{ metodo: 'EFECTIVO', monto: ctx.productPrice }],
      })
      .expect(201);

    expect(sale.body.id).toBeDefined();
    expect(String(sale.body.createdAt)).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const stockAfterSale = await readPosStock(app, adminBearer, ctx.warehouseId, ctx.productId);
    expect(stockAfterSale).toBe(stockBefore - 1);

    await request(app.getHttpServer())
      .post(`/api/v1/sales/${sale.body.id}/void`)
      .set(adminBearer)
      .send({ reason: 'E2E stock restore' })
      .expect(201);

    const stockAfterVoid = await readPosStock(app, adminBearer, ctx.warehouseId, ctx.productId);
    expect(stockAfterVoid).toBe(stockBefore);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
      .set(adminBearer)
      .send({ montoCierreFisico: 0, notasCierre: 'E2E stock' })
      .expect(201);
  }, 90_000);

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
          documentType: 'NOTA_VENTA',
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
