import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

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

    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.logger.warn(`[DEV] Sin SMTP_HOST — enlace de recuperación para ${to}:`);
      this.logger.warn(resetUrl);
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const from =
      this.config.get<string>('SMTP_FROM')?.trim() ?? 'FactoFarm <noreply@factofarm.local>';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({ from, to, subject, text });
  }

  async sendTransactional(to: string, subject: string, text: string): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.logger.warn(`[DEV] Sin SMTP_HOST — correo a ${to}: ${subject}`);
      this.logger.warn(text);
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const from =
      this.config.get<string>('SMTP_FROM')?.trim() ?? 'FactoFarm <noreply@factofarm.local>';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({ from, to, subject, text });
  }
}
