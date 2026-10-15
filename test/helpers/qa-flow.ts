import { randomUUID } from 'crypto';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { formatDateYmdInTimeZone } from '../../src/common/utils/timezone.util';
import type { PosContext } from './pos-flow';

type Bearer = Record<string, string>;

export function bearerOf(token: string): Bearer {
  return { Authorization: `Bearer ${token}` };
}

export async function readPosStock(
  app: INestApplication<App>,
  bearer: Bearer,
  warehouseId: string,
  productId: string,
  search = '0001',
): Promise<number> {
  const res = await request(app.getHttpServer())
    .get('/api/v1/sales/pos-catalog')
    .query({ warehouseId, search })
    .set(bearer)
    .expect(200);

  const row = (
    res.body as Array<{
      id?: string;
      stock?: string | number;
    }>
  ).find((p) => p.id === productId);
  if (!row) return 0;
  return Number(row.stock ?? 0);
}

export async function findCustomerId(
  app: INestApplication<App>,
  bearer: Bearer,
  documento = '99999999',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .get('/api/v1/customers')
    .query({ search: documento, field: 'numeroDocumento', pageSize: 5 })
    .set(bearer)
    .expect(200);

  const id = (res.body as { id: string; items: { id: string }[] }).items?.[0]
    ?.id as string | undefined;
  if (!id) throw new Error(`Cliente seed ${documento} no encontrado`);
  return id;
}

export async function createSecondaryWarehouse(
  app: INestApplication<App>,
  bearer: Bearer,
  establishmentId: string,
  nombre = `E2E Almacén ${Date.now()}`,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/warehouses')
    .set(bearer)
    .send({ establishmentId, nombre })
    .expect(201);
  return (res.body as { id: string; items: { id: string }[] }).id;
}

export async function ensureInboundStock(
  app: INestApplication<App>,
  bearer: Bearer,
  ctx: PosContext,
  quantity: number,
): Promise<void> {
  const reasons = await request(app.getHttpServer())
    .get('/api/v1/inventory-movements/catalogs/transfer-reasons')
    .set(bearer)
    .expect(200);

  const reason =
    (
      reasons.body as {
        id: string;
        codigo?: string;
        code?: string;
      }[] as Array<{ id: string; codigo?: string; code?: string }>
    ).find((r) => (r.codigo ?? r.code) === 'COMPRA_NACIONAL') ??
    (reasons.body as { id: string; codigo?: string; code?: string }[])[0];
  if (!reason?.id) throw new Error('Sin motivo de ingreso COMPRA_NACIONAL');

  await request(app.getHttpServer())
    .post('/api/v1/inventory-movements/inbound')
    .set(bearer)
    .send({
      productId: ctx.productId,
      warehouseId: ctx.warehouseId,
      transferReasonId: reason.id,
      quantity,
      unitCost: 1,
      reference: `E2E-IN-${randomUUID().slice(0, 8)}`,
      comment: 'E2E inbound',
    })
    .expect(201);
}

export async function createNotaVenta(
  app: INestApplication<App>,
  bearer: Bearer,
  ctx: PosContext,
  opts: {
    cashSessionId: string;
    quantity?: number;
    customerId?: string;
    metodo?: string;
    monto?: number;
  },
) {
  const quantity = opts.quantity ?? 1;
  const monto = opts.monto ?? ctx.productPrice * quantity;
  return request(app.getHttpServer())
    .post('/api/v1/sales')
    .set(bearer)
    .set('Idempotency-Key', randomUUID())
    .send({
      warehouseId: ctx.warehouseId,
      cashSessionId: opts.cashSessionId,
      documentType: 'NOTA_VENTA',
      ...(opts.customerId ? { customerId: opts.customerId } : {}),
      items: [{ productId: ctx.productId, quantity }],
      payments: [{ metodo: opts.metodo ?? 'EFECTIVO', monto }],
    })
    .expect(201);
}

/** Día civil America/Lima para filtros from/to. */
export function limaTodayYmd(now = new Date()): string {
  return formatDateYmdInTimeZone(now, 'America/Lima');
}
