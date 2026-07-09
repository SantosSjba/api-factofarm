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
import { assertOseCredentialsOrThrow } from '../utils/billing-provider-guard.util';
import { MockBillingProvider } from './mock-billing.provider';

type NubefactResponse = {
  errors?: string;
  codigo?: number;
  enlace_del_pdf?: string;
  enlace_del_xml?: string;
  enlace_del_cdr?: string;
  codigo_respuesta_sunat?: string;
  descripcion_respuesta_sunat?: string;
  cadena_para_codigo_qr?: string;
  serie?: string;
  numero?: number;
  aceptada_por_sunat?: boolean;
};

@Injectable()
export class NubefactBillingProvider implements IBillingProvider {
  private readonly logger = new Logger(NubefactBillingProvider.name);

  constructor(
    private readonly mock: MockBillingProvider,
    private readonly config: ConfigService,
  ) {}

  private apiUrl: string | null = null;
  private apiToken: string | null = null;

  setCredentials(apiUrl: string | null, apiToken: string | null) {
    this.apiUrl = apiUrl;
    this.apiToken = apiToken;
  }

  async emit(input: EmitDocumentInput): Promise<EmitDocumentResult> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const hasCredentials = !!this.apiUrl?.trim() && !!this.apiToken?.trim();
    assertOseCredentialsOrThrow(nodeEnv, hasCredentials, 'Nubefact');
    if (!hasCredentials) {
      this.logger.warn('Nubefact sin credenciales; usando mock (solo desarrollo)');
      return this.mock.emit(input);
    }

    const tipo = this.mapTipoComprobante(input.documentType);
    const body: Record<string, unknown> = {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: tipo,
      serie: input.serie,
      numero: Number.parseInt(input.numero, 10),
      sunat_transaction: input.esContingencia ? 2 : 1,
      cliente_tipo_de_documento: Number.parseInt(input.receptor.tipoDoc, 10) || 0,
      cliente_numero_de_documento: input.receptor.numeroDoc,
      cliente_denominacion: input.receptor.nombre,
      moneda: input.moneda === 'PEN' ? 1 : 2,
      porcentaje_de_igv: 18,
      total_gravada: Number(input.subtotal),
      total_igv: Number(input.igvTotal),
      total: Number(input.total),
      enviar_automaticamente_a_la_sunat: true,
      items: input.lines.map((line) => ({
        unidad_de_medida: line.unidadMedida || 'NIU',
        codigo: line.codigoProducto ?? undefined,
        descripcion: line.descripcion,
        cantidad: Number(line.cantidad),
        valor_unitario: Number(line.subtotalLinea) / Number(line.cantidad || 1),
        precio_unitario: Number(line.totalLinea) / Number(line.cantidad || 1),
        subtotal: Number(line.subtotalLinea),
        tipo_de_igv: 1,
        igv: Number(line.igvLinea),
        total: Number(line.totalLinea),
      })),
    };

    if (input.documentType === 'NOTA_CREDITO' && input.relatedDocument) {
      body.documento_que_se_modifica_tipo =
        input.relatedDocument.documentType === 'FACTURA' ? 1 : 2;
      body.documento_que_se_modifica_serie = input.relatedDocument.serie;
      body.documento_que_se_modifica_numero = Number.parseInt(input.relatedDocument.numero, 10);
      body.tipo_de_nota_de_credito = Number(input.creditNoteReasonCode ?? '09');
    }

    const response = await this.postJson(body);
    return this.toEmitResult(input, response);
  }

  async getStatus(externalId: string): Promise<DocumentStatusResult> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const hasCredentials = !!this.apiUrl?.trim() && !!this.apiToken?.trim();
    if (!hasCredentials) {
      if (nodeEnv === 'production') {
        assertOseCredentialsOrThrow(nodeEnv, false, 'Nubefact');
      }
      return this.mock.getStatus(externalId);
    }
    const [serie, numero] = externalId.split('-');
    const response = await this.postJson({
      operacion: 'consultar_comprobante',
      tipo_de_comprobante: 2,
      serie,
      numero: Number.parseInt(numero ?? '0', 10),
    });
    return {
      sunatStatus: this.mapSunatStatus(response),
      sunatCodigo: response.codigo_respuesta_sunat ?? '0',
      sunatDescripcion: response.descripcion_respuesta_sunat ?? 'Consulta Nubefact',
    };
  }

  async voidDocument(input: VoidDocumentInput): Promise<VoidDocumentResult> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const hasCredentials = !!this.apiUrl?.trim() && !!this.apiToken?.trim();
    assertOseCredentialsOrThrow(nodeEnv, hasCredentials, 'Nubefact');
    if (!hasCredentials) {
      this.logger.warn('Nubefact sin credenciales; mock baja (solo desarrollo)');
      return this.mock.voidDocument(input);
    }
    const response = await this.postJson({
      operacion: 'generar_comunicacion_baja',
      tipo_de_comprobante: this.mapTipoComprobante(input.documentType),
      serie: input.serie,
      numero: Number.parseInt(input.numero, 10),
      motivo: input.reason,
    });
    return {
      sunatStatus: this.mapSunatStatus(response),
      sunatCodigo: response.codigo_respuesta_sunat ?? '0',
      sunatDescripcion:
        response.descripcion_respuesta_sunat ?? response.errors ?? 'Comunicación de baja enviada',
    };
  }

  async sendDailySummary(input: DailySummaryInput): Promise<DailySummaryResult> {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const hasCredentials = !!this.apiUrl?.trim() && !!this.apiToken?.trim();
    assertOseCredentialsOrThrow(nodeEnv, hasCredentials, 'Nubefact');
    if (!hasCredentials) {
      this.logger.warn('Nubefact sin credenciales; mock RC (solo desarrollo)');
      return this.mock.sendDailySummary(input);
    }
    const [year, month, day] = input.fecha.split('-');
    const response = await this.postJson({
      operacion: 'generar_resumen_comprobantes',
      fecha_de_emision_de_documentos: `${day}-${month}-${year}`,
      codigo_tipo_proceso: '1',
    });
    return {
      externalId: `RC-${input.fecha}`,
      sunatStatus: this.mapSunatStatus(response),
      sunatCodigo: response.codigo_respuesta_sunat ?? '0',
      sunatDescripcion:
        response.descripcion_respuesta_sunat ?? response.errors ?? 'Resumen diario enviado',
    };
  }

  private async postJson(body: Record<string, unknown>): Promise<NubefactResponse> {
    const url = this.buildUrl();
    this.logger.log(`Nubefact POST ${url}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Nubefact HTTP ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as NubefactResponse;
    if (data.errors?.trim()) {
      throw new Error(data.errors.trim());
    }
    return data;
  }

  private buildUrl(): string {
    const base = this.apiUrl!.trim().replace(/\/$/, '');
    if (base.includes('/api/v1/')) return base;
    return `${base}/${this.apiToken!.trim()}`;
  }

  private mapTipoComprobante(documentType: string): number {
    const map: Record<string, number> = {
      FACTURA: 1,
      BOLETA: 2,
      NOTA_CREDITO: 3,
      NOTA_DEBITO: 4,
    };
    return map[documentType] ?? 2;
  }

  private mapSunatStatus(response: NubefactResponse): SunatDocumentStatus {
    const code = response.codigo_respuesta_sunat ?? '';
    if (response.aceptada_por_sunat === false || code.startsWith('2')) {
      return SunatDocumentStatus.RECHAZADO;
    }
    if (code === '0' || response.aceptada_por_sunat === true) {
      return SunatDocumentStatus.ACEPTADO;
    }
    return SunatDocumentStatus.OBSERVADO;
  }

  private async toEmitResult(
    input: EmitDocumentInput,
    response: NubefactResponse,
  ): Promise<EmitDocumentResult> {
    const [xmlContent, pdfContent, cdrContent] = await Promise.all([
      this.fetchArtifact(response.enlace_del_xml, input.ublXml),
      this.fetchArtifactBuffer(response.enlace_del_pdf, 'application/pdf'),
      this.fetchArtifactBuffer(response.enlace_del_cdr, 'text/plain'),
    ]);

    return {
      externalId: `${input.serie}-${input.numero}`,
      sunatStatus: this.mapSunatStatus(response),
      sunatCodigo: response.codigo_respuesta_sunat ?? '0',
      sunatDescripcion:
        response.descripcion_respuesta_sunat ?? response.errors ?? 'Emitido vía Nubefact',
      xmlContent,
      pdfContent,
      cdrContent,
    };
  }

  private async fetchArtifact(url: string | undefined, fallback: string): Promise<string> {
    if (!url?.trim()) return fallback;
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      return await res.text();
    } catch {
      return fallback;
    }
  }

  private async fetchArtifactBuffer(
    url: string | undefined,
    contentType: string,
  ): Promise<Buffer> {
    if (!url?.trim()) {
      return Buffer.from(`Nubefact: sin enlace ${contentType}`, 'utf8');
    }
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return Buffer.from(`Nubefact: error ${res.status}`, 'utf8');
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error de descarga';
      return Buffer.from(`Nubefact: ${message}`, 'utf8');
    }
  }
}
