import request from 'supertest';
import bcrypt from 'bcrypt';
import { createE2eApp, closeE2eApp, DEMO_ADMIN } from './helpers/e2e-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/generated/prisma/client';

describe('Perfil y seguridad de contraseña', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;
  let userId: string;
  let email: string;
  beforeAll(async () => {
    app = await createE2eApp();
    const prisma = app.get(PrismaService);
    const reference = await prisma.user.findUniqueOrThrow({
      where: { email: DEMO_ADMIN.email },
    });
    email = `beta-profile-${Date.now()}@example.invalid`;
    const user = await prisma.user.create({
      data: {
        nombre: 'Prueba perfil',
        email,
        role: UserRole.CAJERO,
        tenantId: reference.tenantId,
        establecimientoId: reference.establecimientoId,
        passwordHash: await bcrypt.hash('Test123!old', 10),
      },
    });
    userId = user.id;
  }, 120000);
  afterAll(async () => {
    if (userId) {
      const prisma = app.get(PrismaService);
      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.auditLog.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    if (app) await closeE2eApp(app);
  });
  it('actualiza perfil, rechaza entradas inválidas y revoca sesiones antiguas tras cambio de contraseña', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Test123!old' })
      .expect(200);
    const bearer = { Authorization: `Bearer ${login.body.accessToken}` };
    await request(app.getHttpServer())
      .patch('/api/v1/auth/me')
      .set(bearer)
      .send({ nombre: '  ' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/v1/auth/me')
      .set(bearer)
      .send({ role: 'SUPER_ADMIN' })
      .expect(400);
    const updated = await request(app.getHttpServer())
      .patch('/api/v1/auth/me')
      .set(bearer)
      .send({ nombre: ' Perfil actualizado ' })
      .expect(200);
    expect(updated.body.nombre).toBe('Perfil actualizado');
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set(bearer)
      .send({ currentPassword: 'wrong', newPassword: 'Test123!new' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set(bearer)
      .send({ currentPassword: 'Test123!old', newPassword: 'weakpass' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set(bearer)
      .send({ currentPassword: 'Test123!old', newPassword: 'Test123!new' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(bearer)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Test123!old' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Test123!new' })
      .expect(200);
  }, 60000);
});
