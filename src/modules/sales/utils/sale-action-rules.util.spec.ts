import {
  SaleDocumentType,
  SaleStatus,
  SunatDocumentStatus,
} from '../../../generated/prisma/client';
import { resolveSaleActionFlags } from './sale-action-rules.util';

describe('resolveSaleActionFlags', () => {
  const base = {
    documentType: SaleDocumentType.BOLETA,
    estado: SaleStatus.COMPLETADA,
    archivedAt: null as Date | null,
    hasReturns: false,
    hasActiveCpe: false,
    sunatStatus: null as SunatDocumentStatus | null,
    hasRemainingQty: true,
  };

  it('permite emitir boleta completada sin devoluciones ni CPE', () => {
    const flags = resolveSaleActionFlags(base);
    expect(flags.canEmitCpe).toBe(true);
    expect(flags.canReturn).toBe(true);
    expect(flags.canDebit).toBe(false);
  });

  it('bloquea emitir si hubo devolución total (ANULADA)', () => {
    const flags = resolveSaleActionFlags({
      ...base,
      estado: SaleStatus.ANULADA,
      hasReturns: true,
      hasRemainingQty: false,
    });
    expect(flags.canEmitCpe).toBe(false);
    expect(flags.canReturn).toBe(false);
    expect(flags.emitBlockedReason).toMatch(/anulada|devuelta/i);
  });

  it('bloquea emitir si devolución parcial aunque el estado no sea ANULADA', () => {
    const flags = resolveSaleActionFlags({
      ...base,
      estado: SaleStatus.PARCIALMENTE_DEVUELTA,
      hasReturns: true,
      hasActiveCpe: false,
    });
    expect(flags.canEmitCpe).toBe(false);
    expect(flags.canReturn).toBe(true);
    expect(flags.emitBlockedReason).toMatch(/devoluciones/i);
  });

  it('bloquea convertir NV con devoluciones', () => {
    const flags = resolveSaleActionFlags({
      ...base,
      documentType: SaleDocumentType.NOTA_VENTA,
      hasReturns: true,
      estado: SaleStatus.PARCIALMENTE_DEVUELTA,
    });
    expect(flags.canConvertToCpe).toBe(false);
    expect(flags.canEmitCpe).toBe(false);
  });

  it('permite convertir NV completada sin devoluciones', () => {
    const flags = resolveSaleActionFlags({
      ...base,
      documentType: SaleDocumentType.NOTA_VENTA,
    });
    expect(flags.canConvertToCpe).toBe(true);
    expect(flags.canEmitCpe).toBe(false);
  });

  it('bloquea devolución mientras SUNAT está en vuelo', () => {
    const flags = resolveSaleActionFlags({
      ...base,
      hasActiveCpe: true,
      sunatStatus: SunatDocumentStatus.PENDIENTE,
    });
    expect(flags.canReturn).toBe(false);
    expect(flags.returnBlockedReason).toMatch(/Espere/i);
  });

  it('permite ND solo con CPE aceptado', () => {
    const flags = resolveSaleActionFlags({
      ...base,
      hasActiveCpe: true,
      sunatStatus: SunatDocumentStatus.ACEPTADO,
    });
    expect(flags.canDebit).toBe(true);
    expect(flags.canEmitCpe).toBe(false);
  });
});
