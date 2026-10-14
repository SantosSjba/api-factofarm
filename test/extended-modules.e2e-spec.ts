import { PrismaService } from '../src/prisma/prisma.service';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import { loginAsAdmin, resolvePosContext } from './helpers/pos-flow';
import { readPosStock } from './helpers/qa-flow';
import { EmailService } from '../src/common/services/email.service';

describe('Módulos administrativos y complementarios', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;
  let auth: Awaited<ReturnType<typeof loginAsAdmin>>;
  let bearer: Record<string, string>;
  const suffix = randomUUID().slice(0, 8);
  beforeAll(async () => {
    app = await createE2eApp();
    auth = await loginAsAdmin(app);
    bearer = { Authorization: `Bearer ${auth.token}` };
    // Verifica negocio sin enviar comunicaciones externas desde los datos de pruebas.
    jest
      .spyOn(app.get(EmailService), 'sendTransactional')
      .mockResolvedValue(undefined);
  }, 120000);
  afterAll(async () => {
    if (app) await closeE2eApp(app);
  });
  it.each(['categories', 'brands'])(
    'CRUD de %s, nombre obligatorio y eliminación',
    async (route) => {
      const path = `/api/v1/${route}`;
      await request(app.getHttpServer())
        .post(path)
        .set(bearer)
        .send({ nombre: '' })
        .expect(400);
      const created = await request(app.getHttpServer())
        .post(path)
        .set(bearer)
        .send({ nombre: `QA beta ${route} ${suffix}` })
        .expect(201);
      const id = created.body.id;
      expect(id).toBeDefined();
      const update = await request(app.getHttpServer())
        .patch(`${path}/${id}`)
        .set(bearer)
        .send({ nombre: `QA actualizado ${suffix}` })
        .expect(200);
      expect(update.body.nombre.toLowerCase()).toContain('actualizado');
      const listed = await request(app.getHttpServer())
        .get(path)
        .query({ search: suffix, page: 1, pageSize: 100 })
        .set(bearer)
        .expect(200);
      expect(listed.body.items.some((row: any) => row.id === id)).toBe(true);
      await request(app.getHttpServer())
        .delete(`${path}/${id}`)
        .set(bearer)
        .expect(200);
      const after = await request(app.getHttpServer())
        .get(path)
        .query({ search: suffix, page: 1, pageSize: 100 })
        .set(bearer)
        .expect(200);
      expect(after.body.items.some((row: any) => row.id === id)).toBe(false);
    },
    60000,
  );
  it('promoción, validación de código, desactivación y filtro false', async () => {
    const code = `QA-${suffix}`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/promotions')
      .set(bearer)
      .send({
        codigo: code,
        nombre: 'QA beta promoción',
        tipo: 'PORCENTAJE_VENTA',
        valor: 10,
      })
      .expect(201);
    const active = await request(app.getHttpServer())
      .get('/api/v1/promotions/validate')
      .set(bearer)
      .query({ code })
      .expect(200);
    expect(active.body.valid).toBe(true);
    await request(app.getHttpServer())
      .patch(`/api/v1/promotions/${created.body.id}`)
      .set(bearer)
      .send({ activo: false })
      .expect(200);
    const inactive = await request(app.getHttpServer())
      .get('/api/v1/promotions/validate')
      .set(bearer)
      .query({ code })
      .expect(200);
    expect(inactive.body.valid).toBe(false);
    const filtered = await request(app.getHttpServer())
      .get('/api/v1/promotions')
      .set(bearer)
      .query({ activo: 'false', search: 'QA beta promoción' })
      .expect(200);
    expect(filtered.body.items.some((p: any) => p.id === created.body.id)).toBe(
      true,
    );
    await request(app.getHttpServer())
      .delete(`/api/v1/promotions/${created.body.id}`)
      .set(bearer)
      .expect(200);
  }, 60000);
  it('cuenta bancaria, ingreso y conciliación conservan importe y estado', async () => {
    const account = await request(app.getHttpServer())
      .post('/api/v1/finance/bank-accounts')
      .set(bearer)
      .send({ nombre: `QA beta ${suffix}`, tipo: 'BANCO' })
      .expect(201);
    const movement = await request(app.getHttpServer())
      .post('/api/v1/finance/bank-movements')
      .set(bearer)
      .send({
        bankAccountId: account.body.id,
        tipo: 'INGRESO',
        monto: 100,
        referencia: `QA-${suffix}`,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/finance/bank-movements')
      .set(bearer)
      .send({ bankAccountId: account.body.id, tipo: 'INGRESO', monto: -1 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/finance/bank-movements/reconcile')
      .set(bearer)
      .send({ movementIds: [movement.body.id] })
      .expect(201);
    const listed = await request(app.getHttpServer())
      .get('/api/v1/finance/bank-movements')
      .set(bearer)
      .query({ bankAccountId: account.body.id, conciliado: 'true' })
      .expect(200);
    expect(
      listed.body.items.some(
        (m: any) => m.id === movement.body.id && Number(m.monto) === 100,
      ),
    ).toBe(true);
    const pending = await request(app.getHttpServer())
      .get('/api/v1/finance/bank-movements')
      .set(bearer)
      .query({ bankAccountId: account.body.id, conciliado: 'false' })
      .expect(200);
    expect(pending.body.items.some((m: any) => m.id === movement.body.id)).toBe(
      false,
    );
  }, 60000);
  it('consumo hospitalario dispensa una vez y descuenta stock una vez', async () => {
    const ctx = await resolvePosContext(app, auth);
    const prisma = app.get(PrismaService);
    const original = await prisma.establishment.findUniqueOrThrow({
      where: { id: auth.establishmentId },
      select: { esHospital: true },
    });
    await prisma.establishment.update({
      where: { id: auth.establishmentId },
      data: { esHospital: true },
    });
    try {
      const area = await request(app.getHttpServer())
        .post('/api/v1/hospital/areas')
        .set(bearer)
        .send({
          codigo: `QA-${suffix}`,
          nombre: 'QA beta botiquín',
          tipo: 'BOTIQUIN',
        })
        .expect(201);
      const before = await readPosStock(
        app,
        bearer,
        ctx.warehouseId,
        ctx.productId,
      );
      const consumption = await request(app.getHttpServer())
        .post('/api/v1/hospital/consumptions')
        .set(bearer)
        .send({
          warehouseId: ctx.warehouseId,
          hospitalAreaId: area.body.id,
          items: [{ productId: ctx.productId, cantidad: 1 }],
        })
        .expect(201);
      const path = `/api/v1/hospital/consumptions/${consumption.body.id}/dispense`;
      await request(app.getHttpServer()).patch(path).set(bearer).expect(200);
      await request(app.getHttpServer()).patch(path).set(bearer).expect(400);
      expect(
        await readPosStock(app, bearer, ctx.warehouseId, ctx.productId),
      ).toBe(before - 1);
    } finally {
      await prisma.establishment.update({
        where: { id: auth.establishmentId },
        data: { esHospital: original.esHospital },
      });
    }
  }, 90000);
  it('pedido delivery se crea, cancela y no descuenta inventario', async () => {
    const ctx = await resolvePosContext(app, auth);
    const before = await readPosStock(
      app,
      bearer,
      ctx.warehouseId,
      ctx.productId,
    );
    const created = await request(app.getHttpServer())
      .post('/api/v1/delivery-orders')
      .set(bearer)
      .send({
        warehouseId: ctx.warehouseId,
        clienteNombre: 'QA beta cliente',
        clienteTelefono: '999000999',
        direccionEntrega: 'Dirección de pruebas',
        items: [{ productId: ctx.productId, quantity: 1 }],
      })
      .expect(201);
    const cancelled = await request(app.getHttpServer())
      .patch(`/api/v1/delivery-orders/${created.body.id}/status`)
      .set(bearer)
      .send({ estado: 'CANCELADO', cancelReason: 'QA beta' })
      .expect(200);
    expect(cancelled.body.estado).toBe('CANCELADO');
    expect(
      await readPosStock(app, bearer, ctx.warehouseId, ctx.productId),
    ).toBe(before);
  }, 90000);
});
