import { randomUUID } from 'crypto';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { DEMO_ADMIN } from './e2e-app';

type AuthContext = {
  token: string;
  userId: string;
  establishmentId: string;
};

export type PosContext = AuthContext & {
  warehouseId: string;
  productId: string;
  productPrice: number;
  cashRegisterId: string;
};

type WarehouseRow = {
  id: string;
  establishment?: { id?: string };
};

type ProductRow = {
  id: string;
  codigoInterno?: string;
  precioUnitarioVenta?: string | number;
  precio?: string | number;
};

type PosCatalogItem = {
  id?: string;
  codigoInterno?: string;
  precio?: string | number;
};

export async function loginAsAdmin(app: INestApplication<App>): Promise<AuthContext> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(DEMO_ADMIN)
    .expect(200);

  return {
    token: res.body.accessToken,
    userId: res.body.user.id,
    establishmentId: res.body.user.establecimientoId,
  };
}

async function findWarehouseWithStock(
  app: INestApplication<App>,
  bearer: Record<string, string>,
  warehouses: WarehouseRow[],
  search: string,
): Promise<{ warehouse: WarehouseRow; catalogItem: PosCatalogItem | null; productRow: ProductRow | null }> {
  const productsRes = await request(app.getHttpServer())
    .get('/api/v1/products')
    .query({ search, field: 'codigoInterno', pageSize: 5 })
    .set(bearer)
    .expect(200);

  const productRow =
    productsRes.body.items?.find((p: ProductRow) => p.codigoInterno === search) ??
    productsRes.body.items?.[0] ??
    null;

  for (const warehouse of warehouses) {
    const catalogRes = await request(app.getHttpServer())
      .get('/api/v1/sales/pos-catalog')
      .query({ warehouseId: warehouse.id, search })
      .set(bearer)
      .expect(200);

    if (Array.isArray(catalogRes.body) && catalogRes.body.length > 0) {
      const catalogItem =
        catalogRes.body.find((p: PosCatalogItem) => p.codigoInterno === search) ??
        catalogRes.body[0];
      return { warehouse, catalogItem, productRow };
    }
  }

  if (productRow?.id && warehouses[0]) {
    return { warehouse: warehouses[0], catalogItem: null, productRow };
  }

  throw new Error(`Seed incompleto para E2E POS (producto ${search} o almacén con stock)`);
}

export async function resolvePosContext(
  app: INestApplication<App>,
  auth: AuthContext,
): Promise<PosContext> {
  const bearer = { Authorization: `Bearer ${auth.token}` };

  const [warehousesRes, registersRes] = await Promise.all([
    request(app.getHttpServer()).get('/api/v1/products/catalogs/warehouses').set(bearer).expect(200),
    request(app.getHttpServer()).get('/api/v1/cash-registers').set(bearer).expect(200),
  ]);

  const scopedWarehouses = warehousesRes.body.filter(
    (w: WarehouseRow) => w.establishment?.id === auth.establishmentId,
  );
  const warehouses = scopedWarehouses.length > 0 ? scopedWarehouses : warehousesRes.body;

  const { warehouse, catalogItem, productRow } = await findWarehouseWithStock(
    app,
    bearer,
    warehouses,
    '0001',
  );

  const register = registersRes.body[0];
  if (!warehouse?.id || !productRow?.id || !register?.id) {
    throw new Error('Seed incompleto para E2E POS (almacén, producto 0001 o caja)');
  }

  const productPrice = Number(
    catalogItem?.precio ?? productRow.precioUnitarioVenta ?? productRow.precio ?? 3,
  );

  return {
    ...auth,
    warehouseId: warehouse.id,
    productId: productRow.id,
    productPrice,
    cashRegisterId: register.id,
  };
}

export async function ensureOpenCashSession(
  app: INestApplication<App>,
  ctx: PosContext,
): Promise<{ id: string }> {
  const bearer = { Authorization: `Bearer ${ctx.token}` };

  const activeRes = await request(app.getHttpServer())
    .get('/api/v1/cash-registers/sessions/active')
    .set(bearer)
    .expect(200);

  if (activeRes.body?.id) {
    const summaryRes = await request(app.getHttpServer())
      .get(`/api/v1/cash-registers/sessions/${activeRes.body.id}/summary`)
      .set(bearer)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${activeRes.body.id}/close`)
      .set(bearer)
      .send({
        montoCierreFisico: Number(summaryRes.body.saldoActual ?? 0),
        notasCierre: 'E2E cleanup',
      })
      .expect(201);
  }

  const session = await request(app.getHttpServer())
    .post('/api/v1/cash-registers/sessions/open')
    .set(bearer)
    .send({ cashRegisterId: ctx.cashRegisterId, montoApertura: 0 })
    .expect(201);

  return session.body;
}

export async function waitForSaleBillingAccepted(
  app: INestApplication<App>,
  token: string,
  saleId: string,
  timeoutMs = 30_000,
) {
  const bearer = { Authorization: `Bearer ${token}` };
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/billing/sales/${saleId}/status`)
      .set(bearer)
      .expect(200);

    if (res.body?.sunatStatus === 'ACEPTADO') return res.body;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Timeout esperando sunatStatus ACEPTADO para venta ${saleId}`);
}

export async function runPosSaleFlow(app: INestApplication<App>, ctx: PosContext) {
  const bearer = { Authorization: `Bearer ${ctx.token}` };

  const session = await ensureOpenCashSession(app, ctx);

  const sale = await request(app.getHttpServer())
    .post('/api/v1/sales')
    .set(bearer)
    .set('Idempotency-Key', randomUUID())
    .send({
      warehouseId: ctx.warehouseId,
      cashSessionId: session.id,
      documentType: 'BOLETA',
      items: [{ productId: ctx.productId, quantity: 1 }],
      payments: [{ metodo: 'EFECTIVO', monto: ctx.productPrice }],
    })
    .expect(201);

  const cpe = await request(app.getHttpServer())
    .post(`/api/v1/billing/sales/${sale.body.id}/emit`)
    .set(bearer)
    .send({})
    .expect(201);

  const billingStatus = await waitForSaleBillingAccepted(app, ctx.token, sale.body.id);

  const close = await request(app.getHttpServer())
    .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
    .set(bearer)
    .send({ montoCierreFisico: ctx.productPrice, notasCierre: 'E2E' })
    .expect(201);

  return { session: { body: session }, sale, cpe: { body: { ...cpe.body, sunatStatus: billingStatus.sunatStatus } }, close };
}
