import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../common/services/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { ContactRequestDto } from './dto/contact-request.dto';

@Injectable()
export class PublicContactService {
  private readonly logger = new Logger(PublicContactService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly tenants: TenantsService,
  ) {}

  async submitLead(dto: ContactRequestDto): Promise<{ ok: true }> {
    await this.tenants.createLeadFromPublic({
      nombre: dto.nombre,
      farmacia: dto.farmacia,
      telefono: dto.telefono,
      email: dto.email,
      mensaje: dto.mensaje,
    });
    const salesEmail = this.config.get<string>('SALES_CONTACT_EMAIL')?.trim();
    const subject = `FactoFarm — Solicitud de cuenta: ${dto.farmacia.trim()}`;
    const text = [
      'Nueva solicitud desde la landing de FactoFarm',
      '',
      `Nombre: ${dto.nombre.trim()}`,
      `Farmacia / botica: ${dto.farmacia.trim()}`,
      `Teléfono: ${dto.telefono.trim()}`,
      `Correo: ${dto.email.trim().toLowerCase()}`,
      '',
      'Mensaje:',
      dto.mensaje?.trim() || '(sin mensaje adicional)',
    ].join('\n');

    if (salesEmail) {
      await this.email.sendTransactional(salesEmail, subject, text);
    } else {
      this.logger.warn('[DEV] Sin SALES_CONTACT_EMAIL — solicitud de cuenta:');
      this.logger.warn(text);
    }

    return { ok: true };
  }
}
