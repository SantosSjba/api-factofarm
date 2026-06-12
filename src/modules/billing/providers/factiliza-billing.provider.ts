import { Injectable, Logger } from '@nestjs/common';
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
  extractBase64Artifact,
  mapFactilizaAfectadoTipo,
  mapFactilizaTipoDoc,
  peruEmissionDate,
  roundMoney,
  type FactilizaOkResponse,
} from '../utils/factiliza.helpers';
import { MockBillingProvider } from './mock-billing.provider';

const DEFAULT_API_URL = 'https://apife-qa.factiliza.com/api/v1';

@Injectable()
export class FactilizaBillingProvider implements IBillingProvider {
  private readonly logger = new Logger(FactilizaBillingProvider.name);

  constructor(private readonly mock: MockBillingProvider) {}

  private apiUrl: string | null = null;
  private apiToken: string | null = null;

  setCredentials(apiUrl: string | null, apiToken: string | null) {
    this.apiUrl = apiUrl?.trim() || DEFAULT_API_URL;
    this.apiToken = apiToken;
  }

  async emit(input: EmitDocumentInput): Promise<EmitDocumentResult> {
    if (!this.apiToken?.trim()) {
      this.logger.warn('Factiliza sin token Bearer; usando mock');
      return this.mock.emit(input);
    }

    const unsupported = new Set([
      'RETENCION',
      'PERCEPCION',
      'LIQUIDACION_COMPRA',
      'NOTA_VENTA',
      'GUIA_REMISION_TRANSPORTISTA',
      'RESUMEN_BOLETAS',
      'COMUNICACION_BAJA',
    ]);
    if (unsupported.has(input.documentType)) {
      this.logger.warn(`Factiliza sin endpoint para ${input.documentType}; mock`);
      return this.mock.emit(input);
    }

    if (input.documentType === 'GUIA_REMISION_REMITENTE') {
      return this.emitDespatch(input);
    }

    const isNote = input.documentType === 'NOTA_CREDITO' || input.documentType === 'NOTA_DEBITO';
    const path = isNote ? '/note/send' : '/invoice/send';
    const body = isNote ? this.buildNoteBody(input) : this.buildInvoiceBody(input);
    const response = await this.postJson<FactilizaOkResponse>(path, body);

    if (!response.success) {
      throw new Error(response.message ?? 'Factiliza rechazó el comprobante');
    }

    const tipoDoc = mapFactilizaTipoDoc(input.documentType);
    const artifactPrefix = isNote ? 'note' : 'invoice';
    const [pdfContent, xmlContent, cdrContent] = await Promise.all([
      this.fetchArtifact(artifactPrefix, 'pdf', input.emisor.ruc, tipoDoc, input.serie, input.numero),
      this.fetchArtifact(artifactPrefix, 'xml', input.emisor.ruc, tipoDoc, input.serie, input.numero),
      this.resolveCdr(response, artifactPrefix, input.emisor.ruc, tipoDoc, input.serie, input.numero),
    ]);

    const cdr = response.data?.sunatResponse?.cdrResponse;
    const sunatStatus = this.mapSunatStatus(response);
    return {
      externalId: cdr?.id ?? `${input.serie}-${input.numero}`,
      sunatStatus,
      sunatCodigo: cdr?.code ?? '0',
      sunatDescripcion: cdr?.description ?? response.message ?? 'Emitido vía Factiliza',
      xmlContent: xmlContent.toString('utf8'),
      pdfContent,
      cdrContent,
    };
  }

  private async emitDespatch(input: EmitDocumentInput): Promise<EmitDocumentResult> {
    if (!input.despatch) throw new Error('Guía de remisión requiere datos de traslado');
    const modalidad = input.despatch.modalidad;
    const path =
      modalidad === 'PRIVADO'
        ? '/despatch-remitente/send-privado'
        : modalidad === 'PUBLICO'
          ? '/despatch-remitente/send-publico'
          : '/despatch-remitente/send-misma-empresa';

    const body = this.buildDespatchBody(input);
    const response = await this.postJson<FactilizaOkResponse>(path, body);
    if (!response.success) {
      throw new Error(response.message ?? 'Factiliza rechazó la guía');
    }

    const cdr = response.data?.sunatResponse?.cdrResponse;
    const [pdfContent, xmlContent, cdrContent] = await Promise.all([
      this.fetchArtifact('despatch-remitente', 'pdf', input.emisor.ruc, '09', input.serie, input.numero),
      this.fetchArtifact('despatch-remitente', 'xml', input.emisor.ruc, '09', input.serie, input.numero),
      this.resolveCdr(response, 'despatch-remitente', input.emisor.ruc, '09', input.serie, input.numero),
    ]);

    return {
      externalId: cdr?.id ?? `${input.serie}-${input.numero}`,
      sunatStatus: this.mapSunatStatus(response),
      sunatCodigo: cdr?.code ?? '0',
      sunatDescripcion: cdr?.description ?? response.message ?? 'Guía emitida vía Factiliza',
      xmlContent: xmlContent.toString('utf8'),
      pdfContent,
      cdrContent,
    };
  }

  async getStatus(externalId: string): Promise<DocumentStatusResult> {
    return this.mock.getStatus(externalId);
  }

  async voidDocument(input: VoidDocumentInput): Promise<VoidDocumentResult> {
    this.logger.warn(
      `Factiliza: comunicación de baja no documentada en API pública; mock para ${input.serie}-${input.numero}`,
    );
    return this.mock.voidDocument(input);
  }

  async sendDailySummary(input: DailySummaryInput): Promise<DailySummaryResult> {
    this.logger.warn('Factiliza: resumen diario RC no documentado; usando mock');
    return this.mock.sendDailySummary(input);
  }

  private buildInvoiceBody(input: EmitDocumentInput): Record<string, unknown> {
    const subtotal = roundMoney(input.subtotal);
    const igv = roundMoney(input.igvTotal);
    const total = roundMoney(input.total);
    const fecha = peruEmissionDate(input.fechaEmision);

    return {
      tipo_Operacion: '0101',
      tipo_Doc: mapFactilizaTipoDoc(input.documentType),
      serie: input.serie,
      correlativo: input.numero.replace(/^0+/, '') || input.numero,
      tipo_Moneda: input.moneda,
      fecha_Emision: fecha,
      empresa_Ruc: input.emisor.ruc,
      cliente_Tipo_Doc: input.receptor.tipoDoc,
      cliente_Num_Doc: input.receptor.numeroDoc,
      cliente_Razon_Social: input.receptor.nombre,
      cliente_Direccion: input.receptor.direccion ?? 'SIN DIRECCION',
      monto_Oper_Gravadas: subtotal,
      monto_Igv: igv,
      total_Impuestos: igv,
      valor_Venta: subtotal,
      sub_Total: total,
      monto_Imp_Venta: total,
      monto_Oper_Exoneradas: 0,
      estado_Documento: input.esContingencia ? '1' : '0',
      manual: false,
      id_Base_Dato: input.documentId,
      detalle: input.lines.map((line) => this.mapDetalle(line)),
      forma_pago: [
        {
          tipo: 'Contado',
          monto: total,
          cuota: 0,
          fecha_Pago: fecha,
        },
      ],
      legend: [
        {
          legend_Code: '1000',
          legend_Value: buildFactilizaLegend(total),
        },
      ],
      ...(input.detraccion
        ? {
            detraccion_Tipo: input.detraccion.codigoBien,
            detraccion_Porcentaje: input.detraccion.porcentaje,
            detraccion_Monto: input.detraccion.monto,
            detraccion_Cuenta_Banco_Nacion: input.detraccion.cuentaBanco,
          }
        : {}),
    };
  }

  private buildDespatchBody(input: EmitDocumentInput): Record<string, unknown> {
    const d = input.despatch!;
    const fecha = peruEmissionDate(input.fechaEmision);
    return {
      serie: input.serie,
      correlativo: input.numero.replace(/^0+/, '') || input.numero,
      fecha_Emision: fecha,
      empresa_Ruc: input.emisor.ruc,
      motivo_Traslado: d.motivoTraslado,
      modalidad_Traslado: d.modalidad === 'MISMA_EMPRESA' ? '02' : d.modalidad === 'PRIVADO' ? '01' : '03',
      peso_Bruto_Total: d.pesoBrutoTotal,
      numero_Bultos: d.numeroBultos,
      partida_Ubigeo: d.partidaUbigeo,
      partida_Direccion: d.partidaDireccion,
      llegada_Ubigeo: d.llegadaUbigeo,
      llegada_Direccion: d.llegadaDireccion,
      destinatario_Tipo_Doc: d.destinatarioTipoDoc,
      destinatario_Num_Doc: d.destinatarioNumDoc,
      destinatario_Razon_Social: d.destinatarioRazonSocial,
      id_Base_Dato: input.documentId,
      detalle: input.lines.map((line, index) => ({
        item: index + 1,
        codigo: line.codigoProducto ?? `P${index + 1}`,
        descripcion: line.descripcion,
        cantidad: roundMoney(line.cantidad),
        unidad: line.unidadMedida || 'NIU',
      })),
    };
  }

  private buildNoteBody(input: EmitDocumentInput): Record<string, unknown> {
    if (!input.relatedDocument) {
      throw new Error('Nota de crédito/débito requiere documento afectado');
    }

    const subtotal = roundMoney(input.subtotal);
    const igv = roundMoney(input.igvTotal);
    const total = roundMoney(input.total);
    const fecha = peruEmissionDate(input.fechaEmision);
    const motivoCod = input.creditNoteReasonCode ?? '09';
    const motivoDes =
      motivoCod === '09' ? 'DEVOLUCION POR ITEMS' : input.voidReasonText ?? 'ANULACION DE LA OPERACION';

    return {
      tipo_Operacion: '0101',
      tipo_Doc: mapFactilizaTipoDoc(input.documentType),
      serie: input.serie,
      correlativo: input.numero.replace(/^0+/, '') || input.numero,
      tipo_Moneda: input.moneda,
      estado_Documento: '0',
      fecha_Emision: fecha,
      Observacion: input.voidReasonText ?? '',
      Manual: false,
      empresa_Ruc: input.emisor.ruc,
      cliente_Tipo_Doc: input.receptor.tipoDoc,
      cliente_Num_Doc: input.receptor.numeroDoc,
      cliente_Razon_Social: input.receptor.nombre,
      cliente_Direccion: input.receptor.direccion ?? 'SIN DIRECCION',
      monto_Igv: igv,
      total_Impuestos: igv,
      valor_Venta: subtotal,
      monto_Oper_Gravadas: subtotal,
      monto_Oper_Exoneradas: 0,
      sub_Total: total,
      monto_Imp_Venta: total,
      afectado_Tipo_Doc: mapFactilizaAfectadoTipo(input.relatedDocument.documentType),
      afectado_Num_Doc: `${input.relatedDocument.serie}-${input.relatedDocument.numero}`,
      motivo_Cod: motivoCod,
      motivo_Des: motivoDes,
      detalle: input.lines.map((line) => this.mapDetalle(line)),
      legend: [
        {
          legend_Code: '1000',
          legend_Value: buildFactilizaLegend(total),
        },
      ],
    };
  }

  private mapDetalle(line: EmitDocumentInput['lines'][number]) {
    const cantidad = roundMoney(line.cantidad);
    const subtotal = roundMoney(line.subtotalLinea);
    const igv = roundMoney(line.igvLinea);
    const total = roundMoney(line.totalLinea);
    const valorUnitario = cantidad > 0 ? roundMoney(subtotal / cantidad) : 0;
    const precioUnitario = cantidad > 0 ? roundMoney(total / cantidad) : 0;
    const tipAfe = line.taxAffectationCodigo ?? '10';
    const porcentajeIgv = tipAfe === '20' || tipAfe === '30' ? 0 : 18;

    return {
      unidad: line.unidadMedida || 'NIU',
      cantidad,
      cod_Producto: line.codigoProducto ?? line.descripcion.slice(0, 20),
      descripcion: line.descripcion,
      monto_Valor_Unitario: valorUnitario,
      monto_Base_Igv: subtotal,
      porcentaje_Igv: porcentajeIgv,
      igv,
      tip_Afe_Igv: tipAfe,
      total_Impuestos: igv,
      monto_Precio_Unitario: precioUnitario,
      monto_Valor_Venta: subtotal,
      factor_Icbper: 0,
      cod_Prod_Sunat: line.codigoSunat ?? '',
    };
  }

  private async resolveCdr(
    response: FactilizaOkResponse,
    prefix: 'invoice' | 'note' | 'despatch-remitente',
    ruc: string,
    tipoDoc: string,
    serie: string,
    correlativo: string,
  ): Promise<Buffer> {
    const zipB64 = response.data?.sunatResponse?.cdrZip;
    if (zipB64) {
      return Buffer.from(zipB64, 'base64');
    }
    return this.fetchArtifact(prefix, 'cdr', ruc, tipoDoc, serie, correlativo);
  }

  private async fetchArtifact(
    prefix: 'invoice' | 'note' | 'despatch-remitente',
    kind: 'pdf' | 'xml' | 'cdr',
    ruc: string,
    tipoDoc: string,
    serie: string,
    correlativo: string,
  ): Promise<Buffer> {
    try {
      const response = await this.postJson<FactilizaOkResponse>(`/${prefix}/${kind}`, {
        empresa_Ruc: ruc,
        tipo_Doc: tipoDoc,
        serie,
        correlativo: correlativo.replace(/^0+/, '') || correlativo,
      });
      const buffer = extractBase64Artifact(response);
      if (buffer) return buffer;
      if (typeof response.data === 'string') {
        return Buffer.from(response.data, 'base64');
      }
    } catch (err) {
      this.logger.warn(
        `Factiliza ${prefix}/${kind} no disponible: ${err instanceof Error ? err.message : 'error'}`,
      );
    }
    return Buffer.from(`Factiliza ${kind} no disponible`, 'utf8');
  }

  private mapSunatStatus(response: FactilizaOkResponse): SunatDocumentStatus {
    const cdr = response.data?.sunatResponse;
    if (!response.success || cdr?.success === false) {
      return SunatDocumentStatus.RECHAZADO;
    }
    const code = cdr?.cdrResponse?.code ?? '0';
    if (code === '0') return SunatDocumentStatus.ACEPTADO;
    if ((cdr?.cdrResponse?.notes?.length ?? 0) > 0) return SunatDocumentStatus.OBSERVADO;
    return SunatDocumentStatus.RECHAZADO;
  }

  private async postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const base = (this.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    this.logger.log(`Factiliza POST ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let payload: T & { message?: string; success?: boolean };
    try {
      payload = JSON.parse(text) as T & { message?: string; success?: boolean };
    } catch {
      throw new Error(`Factiliza respuesta inválida (${res.status}): ${text.slice(0, 300)}`);
    }

    if (!res.ok) {
      throw new Error(payload.message ?? `Factiliza HTTP ${res.status}`);
    }
    return payload;
  }
}
