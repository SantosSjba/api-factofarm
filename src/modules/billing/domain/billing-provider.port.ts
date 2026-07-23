import type { SunatDocumentStatus } from '../../../generated/prisma/client';

export type EmitDocumentInput = {
  documentId: string;
  documentType: string;
  serie: string;
  numero: string;
  fechaEmision: string;
  /** Zona IANA del establecimiento (emisión CPE). */
  timeZone?: string;
  moneda: string;
  subtotal: string;
  igvTotal: string;
  total: string;
  esContingencia: boolean;
  emisor: {
    ruc: string;
    razonSocial: string;
  };
  receptor: {
    tipoDoc: string;
    numeroDoc: string;
    nombre: string;
    direccion?: string;
  };
  lines: Array<{
    descripcion: string;
    codigoProducto?: string | null;
    codigoSunat?: string | null;
    unidadMedida: string;
    cantidad: string;
    precioUnitario: string;
    subtotalLinea: string;
    igvLinea: string;
    totalLinea: string;
    taxAffectationCodigo?: string | null;
  }>;
  ublXml: string;
  relatedDocument?: {
    documentType: 'FACTURA' | 'BOLETA';
    serie: string;
    numero: string;
  };
  creditNoteReasonCode?: string;
  debitNoteReasonCode?: string;
  voidReasonText?: string;
  detraccion?: {
    codigoBien: string;
    porcentaje: number;
    monto: number;
    cuentaBanco: string;
  };
  despatch?: {
    modalidad: 'MISMA_EMPRESA' | 'PRIVADO' | 'PUBLICO';
    motivoTraslado: string;
    partidaUbigeo: string;
    partidaDireccion: string;
    llegadaUbigeo: string;
    llegadaDireccion: string;
    pesoBrutoTotal: number;
    numeroBultos: number;
    destinatarioTipoDoc: string;
    destinatarioNumDoc: string;
    destinatarioRazonSocial: string;
  };
};

export type EmitDocumentResult = {
  externalId: string;
  sunatStatus: SunatDocumentStatus;
  sunatCodigo: string;
  sunatDescripcion: string;
  xmlContent: string;
  pdfContent: Buffer;
  cdrContent: Buffer;
};

export type DocumentStatusResult = {
  sunatStatus: SunatDocumentStatus;
  sunatCodigo: string;
  sunatDescripcion: string;
};

export type VoidDocumentInput = {
  externalId: string;
  reason: string;
  documentType: string;
  serie: string;
  numero: string;
};

export type VoidDocumentResult = {
  sunatStatus: SunatDocumentStatus;
  sunatCodigo: string;
  sunatDescripcion: string;
};

export type DailySummaryInput = {
  fecha: string;
  documentIds: string[];
};

export type DailySummaryResult = {
  externalId: string;
  sunatStatus: SunatDocumentStatus;
  sunatCodigo: string;
  sunatDescripcion: string;
};

export interface IBillingProvider {
  emit(input: EmitDocumentInput): Promise<EmitDocumentResult>;
  getStatus(externalId: string): Promise<DocumentStatusResult>;
  voidDocument(input: VoidDocumentInput): Promise<VoidDocumentResult>;
  sendDailySummary(input: DailySummaryInput): Promise<DailySummaryResult>;
}

export const BILLING_PROVIDER = Symbol('BILLING_PROVIDER');
