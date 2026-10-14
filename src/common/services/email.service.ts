import { PlatformSettingsService } from '../settings/platform-settings.service';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly settings: PlatformSettingsService,
  ) {}

  private isProduction(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private async requireSmtpHostOrDevLog(
    context: string,
    fallbackLog: () => void,
  ): Promise<string | null> {
    const host = (await this.settings.get('SMTP_HOST'))?.trim();
    if (host) return host;
    if (this.isProduction()) {
      throw new ServiceUnavailableException({
        code: 'SMTP_NOT_CONFIGURED',
        message:
          'El servicio de correo no está configurado. Contacte al administrador (SMTP_HOST).',
        details: { context },
      });
    }
    fallbackLog();
    return null;
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'FactoFarm — Recuperación de contraseña';
    const text = [
      'Recibimos una solicitud para restablecer tu contraseña en FactoFarm.',
      '',
      `Abre este enlace (válido por tiempo limitado):`,
      resetUrl,
      '',
      'Si no solicitaste este cambio, ignora este correo.',
    ].join('\n');

    const host = await this.requireSmtpHostOrDevLog('password_reset', () => {
      this.logger.warn(
        `[DEV] Sin SMTP_HOST — enlace de recuperación para ${to}:`,
      );
      this.logger.warn(resetUrl);
    });
    if (!host) return;

    const port = Number(await this.settings.get('SMTP_PORT'));
    const user = await this.settings.get('SMTP_USER');
    const pass = await this.settings.get('SMTP_PASS');
    const from =
      (await this.settings.get('SMTP_FROM'))?.trim() ||
      'FactoFarm <noreply@factofarm.local>';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({ from, to, subject, text });
  }

  async sendTransactional(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const host = await this.requireSmtpHostOrDevLog('transactional', () => {
      this.logger.warn(`[DEV] Sin SMTP_HOST — correo a ${to}: ${subject}`);
      this.logger.warn(text);
    });
    if (!host) return;

    const port = Number(await this.settings.get('SMTP_PORT'));
    const user = await this.settings.get('SMTP_USER');
    const pass = await this.settings.get('SMTP_PASS');
    const from =
      (await this.settings.get('SMTP_FROM'))?.trim() ||
      'FactoFarm <noreply@factofarm.local>';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({ from, to, subject, text });
  }
}
