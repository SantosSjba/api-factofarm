import { BillingService } from '../src/modules/billing/billing.service';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import {
  loginAsAdmin,
  loginAsAdminCadena,
  resolvePosContext,
  ensureOpenCashSession,
  runPosSaleFlow,
} from './helpers/pos-flow';
import {
  bearerOf,
  createNotaVenta,
  createSecondaryWarehouse,
  ensureInboundStock,
  findCustomerId,
  limaTodayYmd,
  readPosStock,
} from './helpers/qa-flow';

/**
 * Matriz QA de flujos de negocio (America/Lima).
 * Requiere DB local migrada + seed (docker compose db en :5433).
 */
describe('QA business flows (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  }, 120_000);

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('QA-POS-01: venta contado decrementa stock', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    expect(before).toBeGreaterThanOrEqual(1);

    const session = await ensureOpenCashSession(app, ctx);
    await createNotaVenta(app, bearer, ctx, { cashSessionId: session.id, quantity: 1 });

    const after = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    expect(after).toBe(before - 1);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
      .set(bearer)
      .send({ montoCierreFisico: ctx.productPrice, notasCierre: 'QA-POS-01' })
      .expect(201);
  }, 90_000);

  it('QA-POS-02: anulación (otro usuario) restaura stock', async () => {
    const admin = await loginAsAdmin(app);
    const seller = await loginAsAdminCadena(app);
    const ctx = await resolvePosContext(app, admin);
    const adminBearer = bearerOf(admin.token);
    const sellerBearer = bearerOf(seller.token);

    const before = await readPosStock(app, adminBearer, ctx.warehouseId, ctx.productId);
    const session = await ensureOpenCashSession(app, ctx);
    // Vende admin.cadena; anula admin (regla: no anular propia venta; mismo establecimiento 0000)
    const sale = await createNotaVenta(app, sellerBearer, ctx, { cashSessionId: session.id });

    expect(await readPosStock(app, adminBearer, ctx.warehouseId, ctx.productId)).toBe(before - 1);

    await request(app.getHttpServer())
      .post(`/api/v1/sales/${sale.body.id}/void`)
      .set(adminBearer)
      .send({ reason: 'QA-POS-02' })
      .expect(201);

    expect(await readPosStock(app, adminBearer, ctx.warehouseId, ctx.productId)).toBe(before);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
      .set(adminBearer)
      .send({ montoCierreFisico: 0, notasCierre: 'QA-POS-02' })
      .expect(201);
  }, 90_000);

  it('QA-POS-03: nota de venta no admite devolución NC (regla negocio)', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    const session = await ensureOpenCashSession(app, ctx);
    const sale = await createNotaVenta(app, bearer, ctx, { cashSessionId: session.id });

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/sales/${sale.body.id}`)
      .set(bearer)
      .expect(200);

    const saleItemId = detail.body.items?.[0]?.id as string;
    expect(saleItemId).toBeDefined();

    const ret = await request(app.getHttpServer())
      .post(`/api/v1/sales/${sale.body.id}/returns`)
      .set(bearer)
      .send({
        motivo: 'QA-POS-03 cliente devolvió',
        items: [{ saleItemId, quantity: 1 }],
      });

    expect(ret.status).toBe(400);
    expect(String(ret.body.message ?? ret.body.error ?? '')).toMatch(/boleta|factura/i);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
      .set(bearer)
      .send({ montoCierreFisico: ctx.productPrice, notasCierre: 'QA-POS-03' })
      .expect(201);
  }, 90_000);

  it('QA-POS-04: crédito crea CxC y pago la cierra', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);
    const customerId = await findCustomerId(app, bearer);

    const session = await ensureOpenCashSession(app, ctx);
    const sale = await createNotaVenta(app, bearer, ctx, {
      cashSessionId: session.id,
      customerId,
      metodo: 'CREDITO',
      monto: ctx.productPrice,
    });

    const arList = await request(app.getHttpServer())
      .get('/api/v1/accounts-receivable')
      .query({ customerId, pageSize: 50 })
      .set(bearer)
      .expect(200);

    const rows = (arList.body.items ?? []) as Array<{
      id: string;
      saldo?: string;
      estado?: string;
      sale?: { id?: string };
    }>;
    const ar = rows.find((r) => r.sale?.id === sale.body.id);
    expect(ar?.id).toBeDefined();
    const payAmount = Number(ar!.saldo ?? ctx.productPrice);
    expect(payAmount).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(`/api/v1/accounts-receivable/${ar!.id}/payments`)
      .set(bearer)
      .send({ amount: payAmount, metodo: 'EFECTIVO', referencia: 'QA-POS-04' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
      .set(bearer)
      .send({ montoCierreFisico: 0, notasCierre: 'QA-POS-04' })
      .expect(201);
  }, 90_000);

  it('QA-INV-01: recepción compra aumenta stock', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);

    const supplier = await request(app.getHttpServer())
      .post('/api/v1/suppliers')
      .set(bearer)
      .send({
        razonSocial: `Proveedor E2E ${Date.now()}`,
        tipoDocumento: 'RUC',
        numeroDocumento: '20131312955',
        diasCredito: 30,
        habilitado: true,
      });

    // RUC puede ya existir: reutilizar listado
    let supplierId = supplier.body?.id as string | undefined;
    if (supplier.status >= 400) {
      const list = await request(app.getHttpServer())
        .get('/api/v1/suppliers')
        .query({ search: '20131312955', field: 'numeroDocumento', pageSize: 5 })
        .set(bearer)
        .expect(200);
      supplierId = list.body.items?.[0]?.id;
    }
    expect(supplierId).toBeDefined();

    const po = await request(app.getHttpServer())
      .post('/api/v1/purchases/purchase-orders')
      .set(bearer)
      .send({
        supplierId,
        warehouseId: ctx.warehouseId,
        comentario: 'QA-INV-01',
        items: [{ productId: ctx.productId, quantity: 5, unitPrice: 1.5 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/purchases/purchase-orders/${po.body.id}/approve`)
      .set(bearer)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/purchases/purchase-orders/${po.body.id}/send`)
      .set(bearer)
      .expect(201);

    const poItemId = po.body.items?.[0]?.id as string;
    expect(poItemId).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/v1/purchases/purchase-orders/${po.body.id}/receipts`)
      .set(bearer)
      .send({
        referenciaDoc: `GR-${Date.now()}`,
        items: [{ purchaseOrderItemId: poItemId, quantity: 5, unitCost: 1.5 }],
      })
      .expect(201);

    const after = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    expect(after).toBe(before + 5);
  }, 120_000);

  it('QA-INV-01b: inbound directo aumenta stock', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    await ensureInboundStock(app, bearer, ctx, 3);
    const after = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    expect(after).toBe(before + 3);
  }, 60_000);

  it('QA-INV-02: traslado mueve stock entre almacenes', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    await ensureInboundStock(app, bearer, ctx, 4);
    const toWarehouseId = await createSecondaryWarehouse(app, bearer, ctx.establishmentId);

    const fromBefore = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    const qty = 2;

    const transfer = await request(app.getHttpServer())
      .post('/api/v1/inventory-transfers')
      .set(bearer)
      .send({
        fromWarehouseId: ctx.warehouseId,
        toWarehouseId,
        guiaNumero: `E2E-${Date.now().toString().slice(-6)}`,
        comentario: 'QA-INV-02',
        items: [{ productId: ctx.productId, cantidad: qty, costoUnitario: 1 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/inventory-transfers/${transfer.body.id}/dispatch`)
      .set(bearer)
      .expect(201);

    expect(await readPosStock(app, bearer, ctx.warehouseId, ctx.productId)).toBe(fromBefore - qty);

    await request(app.getHttpServer())
      .post(`/api/v1/inventory-transfers/${transfer.body.id}/receive`)
      .set(bearer)
      .expect(201);

    const toStock = await readPosStock(app, bearer, toWarehouseId, ctx.productId, '0001');
    expect(toStock).toBeGreaterThanOrEqual(qty);
  }, 120_000);

  it('QA-INV-03: ajuste pequeño aplica stock de inmediato', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    const target = before + 2;

    const adj = await request(app.getHttpServer())
      .post('/api/v1/inventory-movements/adjustments')
      .set(bearer)
      .send({
        productId: ctx.productId,
        warehouseId: ctx.warehouseId,
        countedQuantity: target,
        reason: 'QA-INV-03 conteo',
      })
      .expect(201);

    expect(adj.body.applied === true || adj.body.pendingApproval === true).toBe(true);
    if (adj.body.applied) {
      expect(await readPosStock(app, bearer, ctx.warehouseId, ctx.productId)).toBe(target);
    }
  }, 60_000);

  it('QA-REP-01: listado ventas filtra día civil America/Lima', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    const session = await ensureOpenCashSession(app, ctx);
    const sale = await createNotaVenta(app, bearer, ctx, { cashSessionId: session.id });

    const today = limaTodayYmd();
    const list = await request(app.getHttpServer())
      .get('/api/v1/sales')
      .query({ from: today, to: today, pageSize: 50 })
      .set(bearer)
      .expect(200);

    const items = (list.body.items ?? []) as Array<{ id: string; createdAt: string }>;
    expect(items.some((s) => s.id === sale.body.id)).toBe(true);

    for (const row of items.slice(0, 10)) {
      expect(limaTodayYmd(new Date(row.createdAt))).toBe(today);
    }

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
      .set(bearer)
      .send({ montoCierreFisico: ctx.productPrice, notasCierre: 'QA-REP-01' })
      .expect(201);
  }, 90_000);

  it('QA-CPE-01: con emisión electrónica deshabilitada solo permite nota de venta', async () => {
    const canEmit = jest.spyOn(app.get(BillingService), 'establishmentCanEmitCpe').mockResolvedValue(false);
    try {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);

    const session = await ensureOpenCashSession(app, ctx);
    const boleta = await request(app.getHttpServer())
      .post('/api/v1/sales')
      .set(bearer)
      .set('Idempotency-Key', randomUUID())
      .send({
        warehouseId: ctx.warehouseId,
        cashSessionId: session.id,
        documentType: 'BOLETA',
        items: [{ productId: ctx.productId, quantity: 1 }],
        payments: [{ metodo: 'EFECTIVO', monto: ctx.productPrice }],
      });

    expect(boleta.status).toBe(400);
    expect(String(boleta.body.message ?? '')).toMatch(/facturación electrónica|nota de venta/i);

    const { sale, close } = await runPosSaleFlow(app, { ...ctx, token: ctx.token });
    expect(sale.body.id).toBeDefined();
    expect(sale.body.documentType).toBe('NOTA_VENTA');
    expect(close.body.ok).toBe(true);
    } finally { canEmit.mockRestore(); }
  }, 90_000);

  it('QA-CONCUR: 10 ventas concurrentes sin 5xx', async () => {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    const bearer = bearerOf(ctx.token);
    await ensureInboundStock(app, bearer, ctx, 15);

    const session = await ensureOpenCashSession(app, ctx);
    const workers = Array.from({ length: 10 }, () =>
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
        montoCierreFisico:
          ctx.productPrice * responses.filter((r) => r.status === 201).length,
        notasCierre: 'QA-CONCUR',
      })
      .expect(201);
  }, 120_000);
});
