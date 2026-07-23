import {
  SaleDocumentType,
  SaleStatus,
  SunatDocumentStatus,
} from '../../../generated/prisma/client';

/** Estados SUNAT que permiten NC/ND sobre el CPE original. */
export const SUNAT_STATUSES_FOR_NOTE = new Set<SunatDocumentStatus>([
  SunatDocumentStatus.ACEPTADO,
  SunatDocumentStatus.OBSERVADO,
  SunatDocumentStatus.CONTINGENCIA,
]);

export const SUNAT_STATUSES_IN_FLIGHT = new Set<SunatDocumentStatus>([
  SunatDocumentStatus.PENDIENTE,
  SunatDocumentStatus.ENVIANDO,
]);

export type SaleActionSnapshot = {
  documentType: SaleDocumentType;
  estado: SaleStatus;
  archivedAt?: Date | null;
  hasReturns: boolean;
  hasActiveCpe: boolean;
  sunatStatus: SunatDocumentStatus | null;
  hasRemainingQty?: boolean;
};

export type SaleActionFlags = {
  canEmitCpe: boolean;
  canConvertToCpe: boolean;
  canReturn: boolean;
  canDebit: boolean;
  canVoid: boolean;
  emitBlockedReason: string | null;
  convertBlockedReason: string | null;
  returnBlockedReason: string | null;
  debitBlockedReason: string | null;
};

function isBoletaOrFactura(t: SaleDocumentType): boolean {
  return t === SaleDocumentType.BOLETA || t === SaleDocumentType.FACTURA;
}

function isNotaOrTicket(t: SaleDocumentType): boolean {
  return t === SaleDocumentType.NOTA_VENTA || t === SaleDocumentType.TICKET;
}

/**
 * Reglas de negocio para acciones sobre una venta.
 * - Emitir: solo COMPLETADA, sin devoluciones, B/F, sin CPE.
 * - Migrar NV→CPE: solo COMPLETADA, sin devoluciones, NV/TICKET, sin CPE.
 * - Devolver: B/F, no anulada, con saldo; si hay CPE en vuelo → bloquear.
 * - ND: CPE aceptado (u observado/contingencia), no anulada.
 */
export function resolveSaleActionFlags(sale: SaleActionSnapshot): SaleActionFlags {
  const archived = !!sale.archivedAt;
  const anulada = sale.estado === SaleStatus.ANULADA;
  const completada = sale.estado === SaleStatus.COMPLETADA;
  const parcial = sale.estado === SaleStatus.PARCIALMENTE_DEVUELTA;

  let emitBlockedReason: string | null = null;
  if (archived) emitBlockedReason = 'Venta archivada';
  else if (!isBoletaOrFactura(sale.documentType)) {
    emitBlockedReason = 'Solo boletas/facturas se emiten. Migre la nota de venta primero.';
  } else if (anulada) emitBlockedReason = 'Venta anulada o totalmente devuelta';
  else if (sale.hasReturns || parcial) {
    emitBlockedReason =
      'No se puede emitir a SUNAT: la venta tiene devoluciones. Use nota de crédito si el CPE ya estaba aceptado.';
  } else if (!completada) {
    emitBlockedReason = 'Solo ventas completadas se emiten a SUNAT';
  } else if (sale.hasActiveCpe) emitBlockedReason = 'La venta ya tiene comprobante electrónico';

  let convertBlockedReason: string | null = null;
  if (archived) convertBlockedReason = 'Venta archivada';
  else if (!isNotaOrTicket(sale.documentType)) {
    convertBlockedReason = 'Solo notas de venta/tickets se migran a boleta/factura';
  } else if (anulada) convertBlockedReason = 'Venta anulada o totalmente devuelta';
  else if (sale.hasReturns || parcial) {
    convertBlockedReason = 'No se puede migrar: la venta tiene devoluciones';
  } else if (!completada) {
    convertBlockedReason = 'Solo ventas completadas sin devoluciones se pueden migrar';
  } else if (sale.hasActiveCpe) convertBlockedReason = 'Ya tiene comprobante electrónico';

  let returnBlockedReason: string | null = null;
  if (archived) returnBlockedReason = 'Venta archivada';
  else if (!isBoletaOrFactura(sale.documentType)) {
    returnBlockedReason = 'Las devoluciones con NC aplican a boletas/facturas';
  } else if (anulada) returnBlockedReason = 'Venta anulada o totalmente devuelta';
  else if (sale.hasRemainingQty === false) {
    returnBlockedReason = 'No queda cantidad por devolver';
  } else if (sale.sunatStatus && SUNAT_STATUSES_IN_FLIGHT.has(sale.sunatStatus)) {
    returnBlockedReason =
      'Espere a que SUNAT acepte o rechace el comprobante antes de devolver';
  } else if (
    sale.hasActiveCpe &&
    sale.sunatStatus &&
    sale.sunatStatus !== SunatDocumentStatus.RECHAZADO &&
    !SUNAT_STATUSES_FOR_NOTE.has(sale.sunatStatus)
  ) {
    returnBlockedReason = `No se puede devolver con estado SUNAT ${sale.sunatStatus}`;
  }

  let debitBlockedReason: string | null = null;
  if (archived) debitBlockedReason = 'Venta archivada';
  else if (!isBoletaOrFactura(sale.documentType)) {
    debitBlockedReason = 'ND solo aplica a boletas/facturas';
  } else if (anulada) debitBlockedReason = 'Venta anulada o totalmente devuelta';
  else if (!sale.hasActiveCpe || !sale.sunatStatus) {
    debitBlockedReason = 'Requiere CPE emitido y aceptado por SUNAT';
  } else if (!SUNAT_STATUSES_FOR_NOTE.has(sale.sunatStatus)) {
    debitBlockedReason = `SUNAT debe haber aceptado el CPE (actual: ${sale.sunatStatus})`;
  }

  const canVoid = !archived && completada && !sale.hasReturns;

  return {
    canEmitCpe: !emitBlockedReason,
    canConvertToCpe: !convertBlockedReason,
    canReturn:
      !returnBlockedReason && (completada || parcial) && sale.hasRemainingQty !== false,
    canDebit: !debitBlockedReason,
    canVoid,
    emitBlockedReason,
    convertBlockedReason,
    returnBlockedReason,
    debitBlockedReason,
  };
}

export function assertSaleCanEmit(sale: SaleActionSnapshot): void {
  const flags = resolveSaleActionFlags(sale);
  if (!flags.canEmitCpe) {
    throw new Error(flags.emitBlockedReason ?? 'No se puede emitir esta venta');
  }
}
