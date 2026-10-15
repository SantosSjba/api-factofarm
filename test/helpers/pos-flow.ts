type LoginBody = {
  accessToken: string;
  user: { id: string; establecimientoId: string };
};
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

export async function loginAs(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<AuthContext> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    token: (res.body as LoginBody).accessToken,
    userId: (res.body as LoginBody).user.id,
    establishmentId: (res.body as LoginBody).user.establecimientoId,
  };
}

export async function loginAsAdmin(
  app: INestApplication<App>,
): Promise<AuthContext> {
  return loginAs(app, DEMO_ADMIN.email, DEMO_ADMIN.password);
}

/** Mismo establecimiento 0000 que admin — sirve para vender y que admin anule. */
export async function loginAsAdminCadena(
  app: INestApplication<App>,
): Promise<AuthContext> {
  return loginAs(app, 'admin.cadena@factosysperu.com', 'Cadena123!');
}

export async function loginAsCajero(
  app: INestApplication<App>,
): Promise<AuthContext> {
  return loginAs(app, 'cajero@factosysperu.com', 'Cajero123!');
}

async function findWarehouseWithStock(
  app: INestApplication<App>,
  bearer: Record<string, string>,
  warehouses: WarehouseRow[],
  search: string,
): Promise<{
  warehouse: WarehouseRow;
  catalogItem: PosCatalogItem | null;
  productRow: ProductRow | null;
}> {
  const productsRes = await request(app.getHttpServer())
    .get('/api/v1/products')
    .query({ search, field: 'codigoInterno', pageSize: 5 })
    .set(bearer)
    .expect(200);

  const productRow =
    (productsRes.body as { items: ProductRow[] }).items?.find(
      (p: ProductRow) => p.codigoInterno === search,
    ) ??
    (productsRes.body as { items: ProductRow[] }).items?.[0] ??
    null;

  for (const warehouse of warehouses) {
    const catalogRes = await request(app.getHttpServer())
      .get('/api/v1/sales/pos-catalog')
      .query({ warehouseId: warehouse.id, search })
      .set(bearer)
      .expect(200);

    if ((catalogRes.body as PosCatalogItem[]).length > 0) {
      const catalogItem =
        (catalogRes.body as PosCatalogItem[]).find(
          (p: PosCatalogItem) => p.codigoInterno === search,
        ) ?? (catalogRes.body as PosCatalogItem[])[0];
      return { warehouse, catalogItem, productRow };
    }
  }

  if (productRow?.id && warehouses[0]) {
    return { warehouse: warehouses[0], catalogItem: null, productRow };
  }

  throw new Error(
    `Seed incompleto para E2E POS (producto ${search} o almacén con stock)`,
  );
}

export async function resolvePosContext(
  app: INestApplication<App>,
  auth: AuthContext,
): Promise<PosContext> {
  const bearer = { Authorization: `Bearer ${auth.token}` };

  const [warehousesRes, registersRes] = await Promise.all([
    request(app.getHttpServer())
      .get('/api/v1/products/catalogs/warehouses')
      .set(bearer)
      .expect(200),
    request(app.getHttpServer())
      .get('/api/v1/cash-registers')
      .set(bearer)
      .expect(200),
  ]);

  const scopedWarehouses = (warehousesRes.body as WarehouseRow[]).filter(
    (w: WarehouseRow) => w.establishment?.id === auth.establishmentId,
  );
  const warehouses =
    scopedWarehouses.length > 0
      ? scopedWarehouses
      : (warehousesRes.body as WarehouseRow[]);

  const { warehouse, catalogItem, productRow } = await findWarehouseWithStock(
    app,
    bearer,
    warehouses,
    '0001',
  );

  const register = (registersRes.body as { id: string }[])[0];
  if (!warehouse?.id || !productRow?.id || !register?.id) {
    throw new Error(
      'Seed incompleto para E2E POS (almacén, producto 0001 o caja)',
    );
  }

  const productPrice = Number(
    catalogItem?.precio ??
      productRow.precioUnitarioVenta ??
      productRow.precio ??
      3,
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

  const activeSession = activeRes.body as { id: string } | null;
  if (activeSession?.id) {
    const summaryRes = await request(app.getHttpServer())
      .get(`/api/v1/cash-registers/sessions/${activeSession.id}/summary`)
      .set(bearer)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/cash-registers/sessions/${activeSession.id}/close`)
      .set(bearer)
      .send({
        montoCierreFisico: Number(
          (summaryRes.body as { saldoActual: string | number }).saldoActual ??
            0,
        ),
        notasCierre: 'E2E cleanup',
      })
      .expect(201);
  }

  const session = await request(app.getHttpServer())
    .post('/api/v1/cash-registers/sessions/open')
    .set(bearer)
    .send({ cashRegisterId: ctx.cashRegisterId, montoApertura: 0 })
    .expect(201);

  return session.body as { id: string };
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

    if ((res.body as { sunatStatus: string })?.sunatStatus === 'ACEPTADO')
      return res.body as { sunatStatus: string };
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(
    `Timeout esperando sunatStatus ACEPTADO para venta ${saleId}`,
  );
}

/**
 * Flujo POS con nota de venta (válido sin OSE real).
 * Para boleta/CPE se requiere proveedor OSE distinto de MOCK.
 */
export async function runPosSaleFlow(
  app: INestApplication<App>,
  ctx: PosContext,
) {
  const bearer = { Authorization: `Bearer ${ctx.token}` };

  const session = await ensureOpenCashSession(app, ctx);

  const sale = await request(app.getHttpServer())
    .post('/api/v1/sales')
    .set(bearer)
    .set('Idempotency-Key', randomUUID())
    .send({
      warehouseId: ctx.warehouseId,
      cashSessionId: session.id,
      documentType: 'NOTA_VENTA',
      items: [{ productId: ctx.productId, quantity: 1 }],
      payments: [{ metodo: 'EFECTIVO', monto: ctx.productPrice }],
    })
    .expect(201);

  const close = await request(app.getHttpServer())
    .post(`/api/v1/cash-registers/sessions/${session.id}/close`)
    .set(bearer)
    .send({ montoCierreFisico: ctx.productPrice, notasCierre: 'E2E' })
    .expect(201);

  return {
    session: { body: session },
    sale,
    cpe: { body: { sunatStatus: null as string | null, skipped: true } },
    close,
  };
}
