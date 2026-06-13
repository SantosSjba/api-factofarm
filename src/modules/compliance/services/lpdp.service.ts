import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ArcoRequestStatus,
  ArcoRequestType,
  LpdpConsentPurpose,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { SensitiveHealthCryptoService } from './sensitive-health-crypto.service';

export const LPDP_CONSENT_VERSION = '2026-06-11';

const TREATMENT_MATRIX = [
  {
    proceso: 'Registro cliente',
    datos: ['DNI/RUC', 'nombre', 'dirección', 'teléfono'],
    finalidad: 'Ejecución de compraventa',
    baseLegal: 'Contrato',
    retencion: '10 años post última operación',
    destinatarios: ['SUNAT (facturación)'],
  },
  {
    proceso: 'Dispensación con receta',
    datos: ['Diagnóstico', 'medicamentos', 'médico CMP'],
    finalidad: 'Dispensación farmacéutica',
    baseLegal: 'Obligación legal DIGEMID + consentimiento',
    retencion: '5 años mínimo',
    destinatarios: ['DIGEMID (reportes controlados)'],
  },
  {
    proceso: 'Empleados del sistema',
    datos: ['Nombre', 'email', 'perfil laboral'],
    finalidad: 'Gestión de accesos RBAC',
    baseLegal: 'Relación laboral',
    retencion: 'Duración relación + 5 años',
    destinatarios: ['Interno'],
  },
];

@Injectable()
export class LpdpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly crypto: SensitiveHealthCryptoService,
  ) {}

  getTreatmentMatrix() {
    return {
      version: LPDP_CONSENT_VERSION,
      encryptionEnabled: this.crypto.isEnabled(),
      rows: TREATMENT_MATRIX,
    };
  }

  async recordConsent(input: {
    subjectType: string;
    subjectId: string;
    purpose: LpdpConsentPurpose;
    consentVersion?: string;
    recordedById?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const version = input.consentVersion?.trim() || LPDP_CONSENT_VERSION;
    return this.prisma.dataProcessingConsent.create({
      data: {
        subjectType: input.subjectType.trim(),
        subjectId: input.subjectId,
        purpose: input.purpose,
        consentVersion: version,
        recordedById: input.recordedById ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async ensureCustomerConsentOnCreate(
    dto: { lpdpConsentAccepted?: boolean; lpdpConsentVersion?: string },
    customerId: string,
    actorId?: string,
  ) {
    if (!dto.lpdpConsentAccepted) {
      throw new BadRequestException(
        'Se requiere consentimiento LPDP para registrar datos personales del cliente.',
      );
    }
    const version = dto.lpdpConsentVersion?.trim() || LPDP_CONSENT_VERSION;
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { lpdpConsentAt: new Date(), lpdpConsentVersion: version },
    });
    await this.recordConsent({
      subjectType: 'CUSTOMER',
      subjectId: customerId,
      purpose: LpdpConsentPurpose.CUSTOMER_REGISTER,
      consentVersion: version,
      recordedById: actorId,
    });
  }

  async createArcoRequest(
    customerId: string,
    requestType: ArcoRequestType,
    details?: string,
    actorId?: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const created = await this.prisma.arcoRequest.create({
      data: {
        customerId,
        requestType,
        details: details?.trim() || null,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'ArcoRequest',
      entityId: created.id,
      diff: { requestType, customerId },
    });
    return created;
  }

  async listArcoRequests(status?: ArcoRequestStatus) {
    return this.prisma.arcoRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        customer: { select: { id: true, nombre: true, numeroDocumento: true } },
        processedBy: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async processArcoRequest(
    id: string,
    status: ArcoRequestStatus,
    responseNotes?: string,
    actorId?: string,
  ) {
    const row = await this.prisma.arcoRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Solicitud ARCO no encontrada');

    const updated = await this.prisma.arcoRequest.update({
      where: { id },
      data: {
        status,
        responseNotes: responseNotes?.trim() || null,
        processedById: actorId ?? null,
        processedAt: new Date(),
      },
    });

    if (status === ArcoRequestStatus.COMPLETADA && row.requestType === ArcoRequestType.CANCELACION) {
      await this.prisma.customer.update({
        where: { id: row.customerId },
        data: { deletedAt: new Date(), activo: false, habilitado: false },
      });
    }

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      entity: 'ArcoRequest',
      entityId: id,
      diff: { status, responseNotes },
    });
    return updated;
  }

  async exportCustomerData(customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      include: {
        addresses: true,
        prescriptions: {
          where: { deletedAt: null },
          include: { items: true },
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
        sales: {
          where: { deletedAt: null },
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            serie: true,
            numero: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const prescriptions = customer.prescriptions.map((rx) => ({
      ...rx,
      diagnostico:
        this.crypto.decrypt(rx.diagnosticoCipher) ?? rx.diagnostico ?? null,
      notas: this.crypto.decrypt(rx.notasCipher) ?? rx.notas ?? null,
      diagnosticoCipher: undefined,
      notasCipher: undefined,
    }));

    return {
      exportedAt: new Date().toISOString(),
      customer: {
        ...customer,
        prescriptions,
        sales: customer.sales.map((s) => ({
          ...s,
          total: s.total.toString(),
        })),
      },
    };
  }

  async listRetentionCandidates() {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 10);

    const staleCustomers = await this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        sales: { none: { createdAt: { gte: cutoff }, deletedAt: null } },
        prescriptions: { none: { createdAt: { gte: cutoff }, deletedAt: null } },
      },
      select: {
        id: true,
        nombre: true,
        numeroDocumento: true,
        updatedAt: true,
      },
      take: 100,
      orderBy: { updatedAt: 'asc' },
    });

    return {
      policy: 'Clientes sin actividad > 10 años — revisión manual antes de eliminar',
      cutoffDate: cutoff.toISOString(),
      candidates: staleCustomers,
    };
  }

  anonymizeStatsRows<T extends { nombre?: string; numeroDocumento?: string }>(rows: T[]) {
    return rows.map((row) => ({
      ...row,
      nombre: row.nombre ? this.anonymizeLabel(row.nombre) : row.nombre,
      numeroDocumento: row.numeroDocumento
        ? this.anonymizeDocument(row.numeroDocumento)
        : row.numeroDocumento,
    }));
  }

  private anonymizeLabel(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length <= 2) return '**';
    return `${trimmed.slice(0, 2)}***`;
  }

  private anonymizeDocument(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return '****';
    return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
  }
}
