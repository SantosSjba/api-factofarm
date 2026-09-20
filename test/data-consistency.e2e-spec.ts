import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import { loginAsAdmin, resolvePosContext } from './helpers/pos-flow';
import { bearerOf, readPosStock, ensureInboundStock, findCustomerId, createSecondaryWarehouse } from './helpers/qa-flow';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrescriptionsService } from '../src/modules/prescriptions/prescriptions.service';
import { Prisma } from '../src/generated/prisma/client';

describe('Consistencia ante duplicados y concurrencia (PostgreSQL local)', () => {
  let app: INestApplication<App>;
  beforeAll(async () => { app = await createE2eApp(); await app.listen(0, '127.0.0.1'); }, 120000);
  afterAll(async () => { if (app) await closeE2eApp(app); });

  async function context() {
    const auth = await loginAsAdmin(app);
    const ctx = await resolvePosContext(app, auth);
    return { ctx, bearer: bearerOf(ctx.token) };
  }

  async function order() {
    const { ctx, bearer } = await context();
    const suppliers = await request(app.getHttpServer()).get('/api/v1/suppliers')
      .query({ search: '20131312955', field: 'numeroDocumento', pageSize: 5 }).set(bearer).expect(200);
    const supplierId = suppliers.body.items[0]?.id;
    if (!supplierId) throw new Error('Requiere proveedor QA 20131312955 (suite business-flows)');
    const po = await request(app.getHttpServer()).post('/api/v1/purchases/purchase-orders').set(bearer)
      .send({ supplierId, warehouseId: ctx.warehouseId, items: [{ productId: ctx.productId, quantity: 5, unitPrice: 1.5 }] }).expect(201);
    const path = `/api/v1/purchases/purchase-orders/${po.body.id}`;
    await request(app.getHttpServer()).post(`${path}/approve`).set(bearer).expect(201);
    await request(app.getHttpServer()).post(`${path}/send`).set(bearer).expect(201);
    return { ctx, bearer, path, itemId: po.body.items[0].id };
  }

  it('rechaza duplicados excesivos y suma correctamente una recepción dividida', async () => {
    const { ctx, bearer, path, itemId } = await order();
    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    const line = (quantity: number) => ({ purchaseOrderItemId: itemId, quantity, unitCost: 1.5 });
    await request(app.getHttpServer()).post(`${path}/receipts`).set(bearer).send({ items: [line(3), line(3)] }).expect(400);
    expect(await readPosStock(app, bearer, ctx.warehouseId, ctx.productId)).toBe(before);
    const result = await request(app.getHttpServer()).post(`${path}/receipts`).set(bearer).send({ items: [line(2), line(3)] }).expect(201);
    expect(result.body.estado).toBe('RECIBIDA');
    expect(Number(result.body.items[0].cantidadRecibida)).toBe(5);
    expect(await readPosStock(app, bearer, ctx.warehouseId, ctx.productId)).toBe(before + 5);
  }, 60000);

  it('dos recepciones simultáneas no pueden exceder la orden', async () => {
    const { ctx, bearer, path, itemId } = await order();
    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    const responses = await Promise.all([1, 2].map(() => request(app.getHttpServer()).post(`${path}/receipts`).set(bearer)
      .send({ items: [{ purchaseOrderItemId: itemId, quantity: 3, unitCost: 1.5 }] })));
    expect(responses.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(await readPosStock(app, bearer, ctx.warehouseId, ctx.productId)).toBe(before + 3);
    const detail = await request(app.getHttpServer()).get(path).set(bearer).expect(200);
    expect(Number(detail.body.items[0].cantidadRecibida)).toBe(3);
  }, 60000);

  it('diez ingresos concurrentes conservan todas las unidades', async () => {
    const { ctx, bearer } = await context();
    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    await Promise.all(Array.from({ length: 10 }, () => ensureInboundStock(app, bearer, ctx, 1)));
    expect(await readPosStock(app, bearer, ctx.warehouseId, ctx.productId)).toBe(before + 10);
  }, 60000);

  it('dispensaciones concurrentes respetan lo prescrito y los fallos revierten cambios', async () => {
    const { ctx, bearer } = await context();
    const customerId = await findCustomerId(app, bearer);
    const prisma = app.get(PrismaService);
    const warehouse = await prisma.warehouse.findUniqueOrThrow({ where: { id: ctx.warehouseId } });
    const rx = await prisma.prescription.create({ data: {
      establishmentId: warehouse.establishmentId, customerId, fechaEmision: new Date(), numero: `QA-${randomUUID().slice(0, 20)}`,
      items: { create: { productId: ctx.productId, cantidadPrescrita: new Prisma.Decimal(5) } },
    } });
    const service = app.get(PrescriptionsService);
    const dispense = () => prisma.$transaction((tx) => service.applyDispenseFromSale(rx.id,
      [{ productId: ctx.productId, cantidad: new Prisma.Decimal(3) }], undefined, tx, warehouse.establishmentId));
    const outcomes = await Promise.allSettled([dispense(), dispense()]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const getQty = async () => (await prisma.prescriptionItem.findFirstOrThrow({ where: { prescriptionId: rx.id } })).cantidadDispensada.toString();
    expect(await getQty()).toBe('3');
    await expect(prisma.$transaction(async (tx) => {
      await service.applyDispenseFromSale(rx.id, [{ productId: ctx.productId, cantidad: new Prisma.Decimal(2) }], undefined, tx, warehouse.establishmentId);
      throw new Error('simulated sale failure');
    })).rejects.toThrow('simulated sale failure');
    expect(await getQty()).toBe('3');
  }, 60000);

  it('traslado concurrente descuenta e ingresa una sola vez y conserva vencimiento del lote', async () => {
    const { ctx, bearer } = await context();
    const toWarehouseId = await createSecondaryWarehouse(app, bearer, ctx.establishmentId);
    const prisma = app.get(PrismaService);
    const code = `QA-${randomUUID().slice(0, 12)}`;
    const expiration = new Date('2030-12-31T00:00:00Z');
    await prisma.productLotStock.create({ data: { productId: ctx.productId, warehouseId: ctx.warehouseId, codigoLote: code, stock: new Prisma.Decimal(2), fechaVencimiento: expiration } });
    await ensureInboundStock(app, bearer, ctx, 2);
    const before = await readPosStock(app, bearer, ctx.warehouseId, ctx.productId);
    const transfer = await request(app.getHttpServer()).post('/api/v1/inventory-transfers').set(bearer).send({
      fromWarehouseId: ctx.warehouseId, toWarehouseId,
      items: [{ productId: ctx.productId, codigoLote: code, cantidad: 2, costoUnitario: 1 }],
    }).expect(201);
    const path = `/api/v1/inventory-transfers/${transfer.body.id}`;
    const dispatches = await Promise.all([1, 2].map(() => request(app.getHttpServer()).post(`${path}/dispatch`).set(bearer)));
    expect(dispatches.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(await readPosStock(app, bearer, ctx.warehouseId, ctx.productId)).toBe(before - 2);
    const receipts = await Promise.all([1, 2].map(() => request(app.getHttpServer()).post(`${path}/receive`).set(bearer)));
    expect(receipts.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(await readPosStock(app, bearer, toWarehouseId, ctx.productId)).toBe(2);
    const lot = await prisma.productLotStock.findFirstOrThrow({ where: { productId: ctx.productId, warehouseId: toWarehouseId, codigoLote: code } });
    expect(lot.stock.toString()).toBe('2');
    expect(lot.fechaVencimiento).toEqual(expiration);
  }, 60000);
});
