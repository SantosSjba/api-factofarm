import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../common/services/email.service';
import {
  DEFAULT_TIME_ZONE,
  formatDateYmdInTimeZone,
} from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplaintKind, ComplaintRequestDto } from './dto/complaint-request.dto';

@Injectable()
export class PublicComplaintsService {
  private readonly logger = new Logger(PublicComplaintsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async submit(dto: ComplaintRequestDto): Promise<{ ok: true; numeroRegistro: string }> {
    const numeroRegistro = this.buildRegistrationNumber();
    const tipoLabel = dto.tipo === ComplaintKind.RECLAMO ? 'Reclamo' : 'Queja';
    const to =
      this.config.get<string>('COMPLAINTS_EMAIL')?.trim() ||
      this.config.get<string>('SALES_CONTACT_EMAIL')?.trim();

    await this.prisma.complaint.create({
      data: {
        numeroRegistro,
        tipo: dto.tipo,
        nombresApellidos: dto.nombresApellidos.trim(),
        domicilio: dto.domicilio.trim(),
        documentoIdentidad: dto.documentoIdentidad.trim(),
        telefono: dto.telefono.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        bienContratado: dto.bienContratado.trim(),
        montoReclamado: dto.montoReclamado?.trim() || null,
        detalle: dto.detalle.trim(),
        pedido: dto.pedido.trim(),
      },
    });

    const subject = `FactoFarm · Libro de reclamaciones ${numeroRegistro} (${tipoLabel})`;
    const text = [
      'Registro en Libro de Reclamaciones Virtual — FactoFarm',
      '',
      `Número de registro: ${numeroRegistro}`,
      `Fecha/hora (UTC): ${new Date().toISOString()}`,
      `Tipo: ${tipoLabel}`,
      '',
      `Consumidor: ${dto.nombresApellidos.trim()}`,
      `Documento: ${dto.documentoIdentidad.trim()}`,
      `Domicilio: ${dto.domicilio.trim()}`,
      `Teléfono: ${dto.telefono.trim()}`,
      `Correo: ${dto.email?.trim() || '(no indicado)'}`,
      '',
      `Bien contratado: ${dto.bienContratado.trim()}`,
      `Monto reclamado: ${dto.montoReclamado?.trim() || '(no aplica / no indicado)'}`,
      '',
      'Detalle:',
      dto.detalle.trim(),
      '',
      'Pedido del consumidor:',
      dto.pedido.trim(),
    ].join('\n');

    if (to) {
      await this.email.sendTransactional(to, subject, text);
      if (dto.email?.trim()) {
        await this.email.sendTransactional(
          dto.email.trim(),
          `FactoFarm · Registro de ${tipoLabel.toLowerCase()} ${numeroRegistro}`,
          [
            `Hemos registrado su ${tipoLabel.toLowerCase()} en nuestro Libro de Reclamaciones Virtual.`,
            '',
            `Número de registro: ${numeroRegistro}`,
            '',
            'Responderemos en un plazo máximo de quince (15) días hábiles, conforme a la Ley N° 29571.',
            '',
            'Atentamente,',
            'Equipo FactoFarm',
          ].join('\n'),
        );
      }
    } else {
      this.logger.warn(`[DEV] Sin COMPLAINTS_EMAIL — ${numeroRegistro}:`);
      this.logger.warn(text);
    }

    return { ok: true, numeroRegistro };
  }

  private buildRegistrationNumber(): string {
    const ymd = formatDateYmdInTimeZone(new Date(), DEFAULT_TIME_ZONE).replace(/-/g, '');
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `LR-${ymd}-${suffix}`;
  }
}
