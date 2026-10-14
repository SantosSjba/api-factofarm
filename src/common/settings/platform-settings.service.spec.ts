import { ConfigService } from '@nestjs/config';
import { PlatformSettingsService } from './platform-settings.service';
import { settingsSchema } from './settings.catalog';

describe('Configuración de plataforma', () => {
  function setup() {
    const rows = new Map<string, { key: string; value: string }>();
    const table = {
      findMany: jest.fn(async () => [...rows.values()]),
      findUnique: jest.fn(async ({ where }) => rows.get(where.key) ?? null),
      upsert: jest.fn(async ({ create }) => {
        rows.set(create.key, create);
      }),
    };
    const tx = { platformSetting: table, auditLog: { create: jest.fn() } };
    const prisma = { ...tx, $transaction: jest.fn(async (fn) => fn(tx)) };
    const config = new ConfigService({
      BILLING_ENCRYPTION_KEY: 'test-key-with-at-least-thirty-two-characters',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PASS: 'env-secret',
    });
    return {
      service: new PlatformSettingsService(prisma as never, config),
      rows,
      tx,
    };
  }
  it('usa entorno hasta guardar y aplica inmediatamente los cambios', async () => {
    const { service } = setup();
    expect(await service.get('SMTP_HOST')).toBe('smtp.example.com');
    await service.update(
      { SMTP_HOST: 'mail.example.com', SMTP_PORT: '465' },
      'actor',
    );
    expect(await service.get('SMTP_HOST')).toBe('mail.example.com');
    expect(await service.get('SMTP_PORT')).toBe('465');
  });
  it('cifra SMTP_PASS, no lo devuelve y no lo registra en auditoría', async () => {
    const { service, rows, tx } = setup();
    const output = await service.update(
      { SMTP_PASS: 'my-private-password' },
      'actor',
    );
    expect(rows.get('SMTP_PASS')?.value).not.toContain('my-private-password');
    expect(await service.get('SMTP_PASS')).toBe('my-private-password');
    expect(JSON.stringify(output)).not.toContain('my-private-password');
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(
      'my-private-password',
    );
    await service.update({ SMTP_PASS: '' }, 'actor');
    expect(await service.get('SMTP_PASS')).toBe('my-private-password');
  });
  it('la API pública solo expone datos comerciales', async () => {
    const { service } = setup();
    const info = await service.publicInfo();
    expect(info).not.toHaveProperty('SMTP_PASS');
    expect(info).not.toHaveProperty('SMTP_USER');
    expect(info).not.toHaveProperty('JWT_ACCESS_EXPIRES_IN');
  });
  it.each([
    { DATABASE_URL: 'postgresql://bad' },
    { SMTP_PORT: 0 },
    { PASSWORD_RESET_EXPIRES_MINUTES: 1 },
    { CONTACT_EMAIL: 'bad' },
    { SMTP_HOST: null },
    { JWT_REFRESH_EXPIRES_DAYS: 100 },
    {},
  ])('rechaza configuración inválida %j', async (input) => {
    const { service, tx } = setup();
    await expect(service.update(input, 'actor')).rejects.toThrow();
    expect(tx.platformSetting.upsert).not.toHaveBeenCalled();
  });
  it('rechaza saltos de línea en remitente SMTP', () => {
    expect(
      settingsSchema.validate({ SMTP_FROM: 'a@example.com\r\nBcc: x@y.com' })
        .error,
    ).toBeDefined();
  });
});
