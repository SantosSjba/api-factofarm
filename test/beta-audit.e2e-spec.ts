import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import request from 'supertest';
import { createE2eApp, closeE2eApp } from './helpers/e2e-app';
import { loginAsAdmin } from './helpers/pos-flow';
import { PrismaService } from '../src/prisma/prisma.service';
import { PlatformSettingsService } from '../src/common/settings/platform-settings.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../src/generated/prisma/client';

/** Auditoría transversal: inventario de endpoints, lecturas y configuración. */
describe('Beta audit transversal', () => {
  let app: INestApplication;
  const evidence: Array<{
    method: string;
    path: string;
    status: number;
    check: string;
  }> = [];
  beforeAll(async () => {
    app = await createE2eApp();
  }, 120000);
  afterAll(async () => {
    writeFileSync(
      '/tmp/factofarm-endpoint-evidence.json',
      JSON.stringify(evidence, null, 2),
    );
    if (app) await closeE2eApp(app);
  });
  it('ninguna operación privada acepta peticiones sin sesión', async () => {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('audit').setVersion('1').build(),
    );
    const publicPaths = [
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/panel-handoff/exchange',
      '/api/v1/public/',
      '/api/v1/health',
      '/api/v1/legal/',
      '/api/v1/auth/exchange-panel-handoff',
    ];
    const failures: string[] = [];
    for (const [path, operations] of Object.entries(doc.paths)) {
      if (path === '/api/v1' || publicPaths.some((p) => path.startsWith(p)))
        continue;
      for (const method of Object.keys(operations!)) {
        if (!['get', 'post', 'patch', 'put', 'delete'].includes(method))
          continue;
        const resolved = path.replace(
          /\{[^}]+\}/g,
          '00000000-0000-4000-8000-000000000000',
        );
        const res = await (request(app.getHttpServer()) as any)
          [method](resolved)
          .send({});
        evidence.push({
          method,
          path,
          status: res.status,
          check: 'unauthenticated',
        });
        if (res.status !== 401)
          failures.push(`${method} ${path}: ${res.status}`);
      }
    }
    expect(failures).toEqual([]);
  }, 120000);
  it('lecturas sin parámetros no producen errores de servidor', async () => {
    const auth = await loginAsAdmin(app as never);
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('audit').setVersion('1').build(),
    );
    const failures: string[] = [];
    for (const [path, operations] of Object.entries(doc.paths)) {
      if (
        !operations?.get ||
        path.includes('{') ||
        path.includes('/platform/') ||
        path.includes('/tenants')
      )
        continue;
      const res = await request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${auth.token}`);
      evidence.push({
        method: 'get',
        path,
        status: res.status,
        check: 'admin-read',
      });
      if (res.status >= 500)
        failures.push(`${path}: ${res.status} ${res.body?.message}`);
    }
    expect(failures).toEqual([]);
  }, 300000);
  it('todos los roles reales pueden leer su perfil y tienen prohibida configuración global', async () => {
    const auth = await loginAsAdmin(app as never);
    const prisma = app.get(PrismaService);
    const reference = await prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
    });
    const jwt = app.get(JwtService);
    for (const role of Object.values(UserRole).filter(
      (r) => r !== UserRole.SUPER_ADMIN,
    )) {
      const user = await prisma.user.create({
        data: {
          nombre: 'Auditoría beta',
          email: `beta-${role}-${Date.now()}@example.invalid`,
          passwordHash: 'not-used-for-login',
          role,
          tenantId: reference.tenantId,
          establecimientoId: reference.establecimientoId,
        },
      });
      try {
        const token = await jwt.signAsync({
          sub: user.id,
          email: user.email,
          role,
          tenantId: user.tenantId,
          establecimientoId: user.establecimientoId,
          permissionCodes: ['tenants.write', 'users.write'],
        });
        const bearer = { Authorization: `Bearer ${token}` };
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set(bearer)
          .expect(200);
        await request(app.getHttpServer())
          .get('/api/v1/platform/settings')
          .set(bearer)
          .expect(403);
        await request(app.getHttpServer())
          .patch('/api/v1/platform/settings')
          .set(bearer)
          .send({ SMTP_HOST: 'attacker.example.com' })
          .expect(403);
        if (
          ![UserRole.ADMINISTRADOR, UserRole.ADMIN_CADENA].includes(
            role as never,
          )
        ) {
          await request(app.getHttpServer())
            .post('/api/v1/users')
            .set(bearer)
            .send({})
            .expect(403);
        }
        evidence.push({
          method: 'get',
          path: '/api/v1/platform/settings',
          status: 403,
          check: `role:${role}`,
        });
      } finally {
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
  }, 180000);
  it('todos los DTO de escritura rechazan campos desconocidos antes de modificar datos', async () => {
    const auth = await loginAsAdmin(app as never);
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('audit').setVersion('1').build(),
    );
    const failures: string[] = [];
    for (const [path, operations] of Object.entries(doc.paths)) {
      for (const method of ['post', 'patch', 'put'] as const) {
        const operation = operations?.[method];
        const body = operation?.requestBody;
        if (
          !body ||
          !('content' in body) ||
          !body.content['application/json']?.schema ||
          path.startsWith('/api/v1/public/')
        )
          continue;
        const schema = body.content['application/json'].schema;
        if (!schema || !('$ref' in schema)) continue;
        const resolved = path.replace(
          /\{[^}]+\}/g,
          '00000000-0000-4000-8000-000000000000',
        );
        const res = await (request(app.getHttpServer()) as any)
          [method](resolved)
          .set('Authorization', `Bearer ${auth.token}`)
          .send({ __unexpected_beta_field: true });
        evidence.push({
          method,
          path,
          status: res.status,
          check: 'unknown-field',
        });
        if (![400, 403].includes(res.status))
          failures.push(`${method} ${path}: ${res.status}`);
      }
    }
    expect(failures).toEqual([]);
  }, 180000);
  it('configuración persiste, rechaza datos inválidos y público no filtra secretos', async () => {
    const prisma = app.get(PrismaService);
    const operator = await prisma.user.findFirstOrThrow({
      where: { role: UserRole.SUPER_ADMIN, deletedAt: null },
    });
    const token = await app
      .get(JwtService)
      .signAsync({
        sub: operator.id,
        email: operator.email,
        role: operator.role,
        tenantId: operator.tenantId,
        establecimientoId: operator.establecimientoId,
        permissionCodes: [],
      });
    const bearer = { Authorization: `Bearer ${token}` };
    const original = await prisma.platformSetting.findUnique({
      where: { key: 'PASSWORD_RESET_EXPIRES_MINUTES' },
    });
    try {
      await request(app.getHttpServer())
        .patch('/api/v1/platform/settings')
        .set(bearer)
        .send({ DATABASE_URL: 'invalid' })
        .expect(400);
      await request(app.getHttpServer())
        .patch('/api/v1/platform/settings')
        .set(bearer)
        .send({ SMTP_PORT: 0 })
        .expect(400);
      await request(app.getHttpServer())
        .patch('/api/v1/platform/settings')
        .set(bearer)
        .send({ PASSWORD_RESET_EXPIRES_MINUTES: '45' })
        .expect(200);
      expect(
        await app
          .get(PlatformSettingsService)
          .get('PASSWORD_RESET_EXPIRES_MINUTES'),
      ).toBe('45');
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/settings')
        .expect(200);
      expect(res.body).not.toHaveProperty('SMTP_PASS');
      expect(res.body).not.toHaveProperty('JWT_SECRET');
    } finally {
      if (original)
        await prisma.platformSetting.update({
          where: { key: original.key },
          data: { value: original.value },
        });
      else
        await prisma.platformSetting.deleteMany({
          where: { key: 'PASSWORD_RESET_EXPIRES_MINUTES' },
        });
    }
  }, 60000);
});
