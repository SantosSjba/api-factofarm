import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SunatDocumentStatus } from '../../../generated/prisma/client';
import type {
  DailySummaryInput,
  DailySummaryResult,
  DocumentStatusResult,
  EmitDocumentInput,
  EmitDocumentResult,
  IBillingProvider,
  VoidDocumentInput,
  VoidDocumentResult,
} from '../domain/billing-provider.port';
import {
  buildFactilizaLegend,
  mapFactilizaAfectadoTipo,
  mapFactilizaTipoDoc,
  peruEmissionDate,
  roundMoney,
} from '../utils/factiliza.helpers';
import {
  assertEmitDocumentTypeSupportedOrThrow,
  assertOseCredentialsOrThrow,
  assertOseOperationSupportedOrThrow,
} from '../utils/billing-provider-guard.util';
import { MockBillingProvider } from './mock-billing.provider';

/**
 * Conector APIsPERU (https://facturacion.apisperu.com/api/v1).
 * Auth: Bearer con token permanente de la empresa (creada en su panel con cert + SOL).
 * Payload: estilo Greenter/UBL 2.1 (camelCase).
 */
const DEFAULT_API_URL = 'https://facturacion.apisperu.com/api/v1';

type ApisperuSunatResponse = {
  success?: boolean;
  error?: { code?: string; message?: string };
  cdrZip?: string;
  cdrResponse?: {
    accepted?: boolean;
    id?: string;
    code?: string;
    description?: string;
    notes?: string[];
  };
  ticket?: string;
};

type ApisperuSendResponse = {
  xml?: string;
  hash?: string;
  sunatResponse?: ApisperuSunatResponse;
};

@Injectable()
export class ApisperuBillingProvider implements IBillingProvider {
  private readonly logger = new Logger(ApisperuBillingProvider.name);

  constructor(
    private readonly mock: MockBillingProvider,
    private readonly config: ConfigService,
  ) {}

  private apiUrl: string | null = null;
  private apiToken: string | null = null;
  private emisor: { ruc: string; razonSocial: string } | null = null;

  setCredentials(
    apiUrl: string | null,
    apiToken: string | null,
    emisor?: { ruc: string; razonSocial: string } | null,
  ) {
    this.apiUrl = apiUrl?.trim() || DEFAULT_API_URL;
    this.apiToken = apiToken;
    this.emisor = emisor?.ruc ? emisor : null;
  }

  async emit(input: EmitDocumentInput): Promise<EmitDocumentResult> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const hasToken = !!this.apiToken?.trim();
    assertOseCredentialsOrThrow(nodeEnv, hasToken, 'APIsPERU');
    if (!hasToken) {
      this.logger.warn('APIsPERU sin token Bearer; usando mock (solo desarrollo)');
      return this.mock.emit(input);
    }

    const unsupported = new Set([
      'RETENCION',
      'PERCEPCION',
      'LIQUIDACION_COMPRA',
      'NOTA_VENTA',
      'GUIA_REMISION_TRANSPORTISTA',
      'GUIA_REMISION_REMITENTE',
      'RESUMEN_BOLETAS',
      'COMUNICACION_BAJA',
    ]);
    if (unsupported.has(input.documentType)) {
      assertEmitDocumentTypeSupportedOrThrow(nodeEnv, 'APIsPERU', input.documentType);
      this.logger.warn(`APIsPERU conector: ${input.documentType} no cableado; mock (solo desarrollo)`);
      return this.mock.emit(input);
    }

    const isNote = input.documentType === 'NOTA_CREDITO' || input.documentType === 'NOTA_DEBITO';
    const path = isNote ? '/note/send' : '/invoice/send';
    const body = isNote ? this.buildNoteBody(input) : this.buildInvoiceBody(input);
    const response = await this.postJson<ApisperuSendResponse>(path, body);
    const sunat = response.sunatResponse;
    if (sunat?.success === false) {
      throw new Error(
        sunat.error?.message ?? sunat.cdrResponse?.description ?? 'APIsPERU rechazó el comprobante',
      );
    }

    const cdr = sunat?.cdrResponse;
    const xmlContent = response.xml?.trim() || input.ublXml;
    const cdrContent = sunat?.cdrZip
      ? Buffer.from(sunat.cdrZip, 'base64')
      : Buffer.from(cdr?.description ?? 'APIsPERU sin CDR', 'utf8');
    const pdfContent = await this.fetchPdf(isNote ? 'note' : 'invoice', body);

    return {
      externalId: cdr?.id ?? `${input.serie}-${input.numero}`,
      sunatStatus: this.mapSunatStatus(sunat),
      sunatCodigo: cdr?.code ?? '0',
      sunatDescripcion: cdr?.description ?? 'Emitido vía APIsPERU',
      xmlContent,
      pdfContent,
      cdrContent,
    };
  }

  async getStatus(externalId: string): Promise<DocumentStatusResult> {
    return this.mock.getStatus(externalId);
  }

  async voidDocument(input: VoidDocumentInput): Promise<VoidDocumentResult> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const hasToken = !!this.apiToken?.trim();
    assertOseCredentialsOrThrow(nodeEnv, hasToken, 'APIsPERU');
    if (!hasToken) {
      return this.mock.voidDocument(input);
    }
    if (!this.emisor?.ruc) {
      throw new Error('APIsPERU: configure RUC emisor en Mi farmacia para comunicación de baja.');
    }

    const now = peruEmissionDate(new Date().toISOString());
    const tipoDoc = mapFactilizaTipoDoc(input.documentType);
    const body = {
      correlativo: String(Date.now()).slice(-5),
      fecGeneracion: now,
      fecComunicacion: now,
      company: this.companyBlock(this.emisor.ruc, this.emisor.razonSocial),
      details: [
        {
          tipoDoc,
          serie: input.serie,
          correlativo: input.numero.replace(/^0+/, '') || input.numero,
          desMotivoBaja: input.reason || 'ANULACION',
        },
      ],
    };
    const response = await this.postJson<ApisperuSendResponse>('/voided/send', body);
    const sunat = response.sunatResponse;
    const cdr = sunat?.cdrResponse;
    return {
      sunatStatus: this.mapSunatStatus(sunat),
      sunatCodigo: cdr?.code ?? '0',
      sunatDescripcion: cdr?.description ?? 'Comunicación de baja enviada vía APIsPERU',
    };
  }

  async sendDailySummary(input: DailySummaryInput): Promise<DailySummaryResult> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    assertOseCredentialsOrThrow(nodeEnv, !!this.apiToken?.trim(), 'APIsPERU');
    assertOseOperationSupportedOrThrow(
      nodeEnv,
      'APIsPERU',
      'Resumen diario de boletas (RC)',
      'Envíe el RC desde el panel APIsPERU o use Nubefact (integración RC nativa).',
    );
    this.logger.warn(`APIsPERU: RC no cableado en conector; mock para ${input.fecha}`);
    return this.mock.sendDailySummary(input);
  }

  private buildInvoiceBody(input: EmitDocumentInput): Record<string, unknown> {
    const subtotal = roundMoney(input.subtotal);
    const igv = roundMoney(input.igvTotal);
    const total = roundMoney(input.total);
    const fecha = peruEmissionDate(input.fechaEmision, input.timeZone);
    const correlativo = input.numero.replace(/^0+/, '') || input.numero;

    return {
      ublVersion: '2.1',
      tipoOperacion: '0101',
      tipoDoc: mapFactilizaTipoDoc(input.documentType),
      serie: input.serie,
      correlativo,
      fechaEmision: fecha,
      formaPago: { moneda: input.moneda || 'PEN', tipo: 'Contado' },
      tipoMoneda: input.moneda || 'PEN',
      client: this.clientBlock(input),
      company: this.companyBlock(input.emisor.ruc, input.emisor.razonSocial),
      mtoOperGravadas: subtotal,
      mtoIGV: igv,
      valorVenta: subtotal,
      totalImpuestos: igv,
      subTotal: total,
      mtoImpVenta: total,
      details: input.lines.map((line) => this.mapDetail(line)),
      legends: [{ code: '1000', value: buildFactilizaLegend(total) }],
      ...(input.detraccion
        ? {
            detraccion: {
              codBienDetraccion: input.detraccion.codigoBien,
              percent: input.detraccion.porcentaje,
              mount: input.detraccion.monto,
              ctaBanco: input.detraccion.cuentaBanco,
            },
          }
        : {}),
    };
  }

  private buildNoteBody(input: EmitDocumentInput): Record<string, unknown> {
    if (!input.relatedDocument) {
      throw new Error('Nota de crédito/débito requiere documento afectado');
    }
    const subtotal = roundMoney(input.subtotal);
    const igv = roundMoney(input.igvTotal);
    const total = roundMoney(input.total);
    const fecha = peruEmissionDate(input.fechaEmision, input.timeZone);
    const motivoCod =
      input.documentType === 'NOTA_DEBITO'
        ? (input.debitNoteReasonCode ?? '02')
        : (input.creditNoteReasonCode ?? '01');
    const motivoDes =
      input.voidReasonText ??
      (input.documentType === 'NOTA_DEBITO' ? 'AUMENTO EN EL VALOR' : 'ANULACION DE LA OPERACION');

    return {
      ublVersion: '2.1',
      tipoDoc: mapFactilizaTipoDoc(input.documentType),
      serie: input.serie,
      correlativo: input.numero.replace(/^0+/, '') || input.numero,
      fechaEmision: fecha,
      tipDocAfectado: mapFactilizaAfectadoTipo(input.relatedDocument.documentType),
      numDocfectado: `${input.relatedDocument.serie}-${input.relatedDocument.numero}`,
      codMotivo: motivoCod,
      desMotivo: motivoDes,
      tipoMoneda: input.moneda || 'PEN',
      client: this.clientBlock(input),
      company: this.companyBlock(input.emisor.ruc, input.emisor.razonSocial),
      mtoOperGravadas: subtotal,
      mtoIGV: igv,
      totalImpuestos: igv,
      mtoImpVenta: total,
      details: input.lines.map((line) => this.mapDetail(line)),
      legends: [{ code: '1000', value: buildFactilizaLegend(total) }],
    };
  }

  private clientBlock(input: EmitDocumentInput) {
    const numDoc = Number.parseInt(input.receptor.numeroDoc.replace(/\D/g, ''), 10);
    return {
      tipoDoc: input.receptor.tipoDoc,
      numDoc: Number.isFinite(numDoc) ? numDoc : input.receptor.numeroDoc,
      rznSocial: input.receptor.nombre,
      address: {
        direccion: input.receptor.direccion ?? 'SIN DIRECCION',
        provincia: 'LIMA',
        departamento: 'LIMA',
        distrito: 'LIMA',
        ubigueo: '150101',
      },
    };
  }

  private companyBlock(ruc: string, razonSocial: string) {
    const rucNum = Number.parseInt(ruc.replace(/\D/g, ''), 10);
    return {
      ruc: Number.isFinite(rucNum) ? rucNum : ruc,
      razonSocial,
      nombreComercial: razonSocial,
      address: {
        direccion: 'DIRECCION FISCAL',
        provincia: 'LIMA',
        departamento: 'LIMA',
        distrito: 'LIMA',
        ubigueo: '150101',
      },
    };
  }

  private mapDetail(line: EmitDocumentInput['lines'][number]) {
    const cantidad = roundMoney(line.cantidad);
    const subtotal = roundMoney(line.subtotalLinea);
    const igv = roundMoney(line.igvLinea);
    const total = roundMoney(line.totalLinea);
    const valorUnitario = cantidad > 0 ? roundMoney(subtotal / cantidad) : 0;
    const precioUnitario = cantidad > 0 ? roundMoney(total / cantidad) : 0;
    return {
      codProducto: line.codigoProducto ?? 'P001',
      unidad: line.unidadMedida || 'NIU',
      descripcion: line.descripcion,
      cantidad,
      mtoValorUnitario: valorUnitario,
      mtoValorVenta: subtotal,
      mtoBaseIgv: subtotal,
      porcentajeIgv: 18,
      igv,
      tipAfeIgv: 10,
      totalImpuestos: igv,
      mtoPrecioUnitario: precioUnitario,
    };
  }

  private mapSunatStatus(sunat?: ApisperuSunatResponse): SunatDocumentStatus {
    if (!sunat) return SunatDocumentStatus.OBSERVADO;
    if (sunat.success === false || sunat.cdrResponse?.accepted === false) {
      return SunatDocumentStatus.RECHAZADO;
    }
    const code = sunat.cdrResponse?.code ?? '';
    if (code === '0' || sunat.success === true || sunat.cdrResponse?.accepted === true) {
      return SunatDocumentStatus.ACEPTADO;
    }
    if (code.startsWith('2')) return SunatDocumentStatus.RECHAZADO;
    return SunatDocumentStatus.OBSERVADO;
  }

  private async fetchPdf(kind: 'invoice' | 'note', body: Record<string, unknown>): Promise<Buffer> {
    try {
      const res = await fetch(`${this.baseUrl()}/${kind}/pdf`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return Buffer.from(`APIsPERU: PDF HTTP ${res.status}`, 'utf8');
      }
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const json = (await res.json()) as { pdf?: string; base64?: string };
        const raw = json.pdf ?? json.base64;
        if (raw) return Buffer.from(raw, 'base64');
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error PDF';
      return Buffer.from(`APIsPERU: ${message}`, 'utf8');
    }
  }

  private async postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    this.logger.log(`APIsPERU POST ${url}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`APIsPERU HTTP ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  private baseUrl(): string {
    return (this.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiToken!.trim()}`,
    };
  }
}
