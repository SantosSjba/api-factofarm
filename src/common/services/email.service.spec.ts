import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
describe('Correo configurable sin enviar mensajes reales', () => {
  const sendMail = jest.fn().mockResolvedValue({});
  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });
  function service(values: Record<string, string>, production = true) {
    return new EmailService(
      new ConfigService({
        NODE_ENV: production ? 'production' : 'development',
      }),
      { get: async (key: string) => values[key] ?? '' } as never,
    );
  }
  it('recuperación usa credenciales y remitente del panel', async () => {
    const email = service({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'operator',
      SMTP_PASS: 'private',
      SMTP_FROM: 'Botica <no-reply@example.com>',
    });
    await email.sendPasswordReset(
      'test@example.invalid',
      'https://panel.example.com/auth/reset-password?token=demo',
    );
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'operator', pass: 'private' },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Botica <no-reply@example.com>',
        to: 'test@example.invalid',
        text: expect.stringContaining('token=demo'),
      }),
    );
  });
  it('no simula envío en producción si SMTP no está configurado', async () => {
    await expect(
      service({}).sendTransactional('test@example.invalid', 'test', 'test'),
    ).rejects.toThrow();
    expect(sendMail).not.toHaveBeenCalled();
  });
  it('remitente vacío usa fallback y puerto 587 habilita STARTTLS', async () => {
    await service({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
    }).sendTransactional('test@example.invalid', 'test', 'test');
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'FactoFarm <noreply@factofarm.local>' }),
    );
  });
});
