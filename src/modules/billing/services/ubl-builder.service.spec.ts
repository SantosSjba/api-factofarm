import { UblBuilderService } from './ubl-builder.service';

describe('UblBuilderService', () => {
  const builder = new UblBuilderService();

  const baseInput = {
    documentType: 'BOLETA' as const,
    serie: 'B001',
    numero: '00000001',
    fechaEmision: '2026-07-09T10:00:00.000Z',
    moneda: 'PEN',
    emisorRuc: '20123456789',
    emisorRazonSocial: 'BOTICA DEMO SAC',
    receptorTipoDoc: '1',
    receptorNumeroDoc: '12345678',
    receptorNombre: 'CLIENTE DEMO',
    subtotal: '10.00',
    igvTotal: '0.00',
    total: '10.00',
  };

  it('usa IGV 18% en líneas gravadas (código 10)', () => {
    const xml = builder.buildInvoiceOrBoleta({
      ...baseInput,
      lines: [
        {
          lineNumber: 1,
          descripcion: 'PARACETAMOL',
          cantidad: '1',
          precioUnitario: '10.00',
          subtotalLinea: '8.47',
          igvLinea: '1.53',
          totalLinea: '10.00',
          taxAffectationCodigo: '10',
        },
      ],
    });
    expect(xml).toContain('<cbc:Percent>18.00</cbc:Percent>');
    expect(xml).toContain('Tax Category Identifier">10</cbc:ID>');
  });

  it('genera nota de débito con referencia al documento afectado', () => {
    const xml = builder.buildDebitNote({
      serie: 'FD01',
      numero: '00000001',
      fechaEmision: '2026-07-09T10:00:00.000Z',
      moneda: 'PEN',
      emisorRuc: '20123456789',
      emisorRazonSocial: 'BOTICA DEMO SAC',
      receptorTipoDoc: '6',
      receptorNumeroDoc: '20100066603',
      receptorNombre: 'CLIENTE SAC',
      subtotal: '16.95',
      igvTotal: '3.05',
      total: '20.00',
      relatedDocumentType: 'FACTURA',
      relatedSerie: 'F001',
      relatedNumero: '00000100',
      discrepancyReason: 'Interés por mora',
      lines: [
        {
          lineNumber: 1,
          descripcion: 'Interés por mora',
          cantidad: '1',
          precioUnitario: '20.00',
          subtotalLinea: '16.95',
          igvLinea: '3.05',
          totalLinea: '20.00',
          taxAffectationCodigo: '10',
        },
      ],
    });
    expect(xml).toContain('<DebitNote');
    expect(xml).toContain('<cbc:ResponseCode>02</cbc:ResponseCode>');
    expect(xml).toContain('F001-00000100');
  });

  it('usa IGV 0% en líneas inafectas (código 30)', () => {
    const xml = builder.buildInvoiceOrBoleta({
      ...baseInput,
      lines: [
        {
          lineNumber: 1,
          descripcion: 'MEDICAMENTO INAFECTO',
          cantidad: '1',
          precioUnitario: '10.00',
          subtotalLinea: '10.00',
          igvLinea: '0.00',
          totalLinea: '10.00',
          taxAffectationCodigo: '30',
        },
      ],
    });
    expect(xml).toContain('<cbc:Percent>0.00</cbc:Percent>');
    expect(xml).toContain('Tax Category Identifier">30</cbc:ID>');
    expect(xml).not.toContain('<cbc:Percent>18.00</cbc:Percent>');
  });

  it('usa IGV 0% en líneas exoneradas (código 20)', () => {
    const xml = builder.buildCreditNote({
      serie: 'FC01',
      numero: '00000001',
      fechaEmision: '2026-07-09',
      moneda: 'PEN',
      emisorRuc: '20123456789',
      emisorRazonSocial: 'BOTICA DEMO SAC',
      receptorTipoDoc: '1',
      receptorNumeroDoc: '12345678',
      receptorNombre: 'CLIENTE DEMO',
      subtotal: '10.00',
      igvTotal: '0.00',
      total: '10.00',
      relatedDocumentType: 'BOLETA',
      relatedSerie: 'B001',
      relatedNumero: '00000001',
      discrepancyReason: 'DEVOLUCION',
      lines: [
        {
          lineNumber: 1,
          descripcion: 'MEDICAMENTO EXONERADO',
          cantidad: '1',
          precioUnitario: '10.00',
          subtotalLinea: '10.00',
          igvLinea: '0.00',
          totalLinea: '10.00',
          taxAffectationCodigo: '20',
        },
      ],
    });
    expect(xml).toContain('<cbc:Percent>0.00</cbc:Percent>');
    expect(xml).toContain('Tax Category Identifier">20</cbc:ID>');
  });
});
