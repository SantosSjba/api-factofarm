import { SunatDocumentStatus } from '../../../generated/prisma/client';
import { MockBillingProvider } from './mock-billing.provider';

describe('MockBillingProvider (SUNAT mock)', () => {
  const provider = new MockBillingProvider();

  const baseEmitInput = {
    documentId: 'doc-1',
    documentType: 'BOLETA',
    serie: 'B001',
    numero: '00000001',
    fechaEmision: '2026-06-12',
    moneda: 'PEN',
    subtotal: '2.54',
    igvTotal: '0.46',
    total: '3.00',
    esContingencia: false,
    emisor: { ruc: '20100000001', razonSocial: 'Farmacia Demo SAC' },
    receptor: { tipoDoc: '1', numeroDoc: '12345678', nombre: 'Cliente Demo' },
    lines: [
      {
        descripcion: 'Producto demo',
        unidadMedida: 'NIU',
        cantidad: '1',
        precioUnitario: '3.00',
        subtotalLinea: '2.54',
        igvLinea: '0.46',
        totalLinea: '3.00',
      },
    ],
    ublXml: '<Invoice/>',
  };

  it('emite comprobante con estado ACEPTADO', async () => {
    const result = await provider.emit(baseEmitInput);
    expect(result.sunatStatus).toBe(SunatDocumentStatus.ACEPTADO);
    expect(result.externalId).toContain('MOCK-B001');
    expect(result.cdrContent).toBeDefined();
  });

  it('anula comprobante en mock', async () => {
    const result = await provider.voidDocument({
      externalId: 'MOCK-B001-00000001',
      reason: 'Error de digitación',
      documentType: 'BOLETA',
      serie: 'B001',
      numero: '00000001',
    });
    expect(result.sunatStatus).toBe(SunatDocumentStatus.ANULADO);
  });
});
