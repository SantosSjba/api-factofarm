import { Injectable } from '@nestjs/common';
import type { EmitDocumentInput } from '../domain/billing-provider.port';

@Injectable()
export class UblBuilderService {
  buildInvoiceOrBoleta(input: {
    documentType: 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
    serie: string;
    numero: string;
    fechaEmision: string;
    moneda: string;
    emisorRuc: string;
    emisorRazonSocial: string;
    receptorTipoDoc: string;
    receptorNumeroDoc: string;
    receptorNombre: string;
    subtotal: string;
    igvTotal: string;
    total: string;
    lines: Array<{
      lineNumber: number;
      descripcion: string;
      cantidad: string;
      precioUnitario: string;
      subtotalLinea: string;
      igvLinea: string;
      totalLinea: string;
      taxAffectationCodigo?: string | null;
    }>;
  }): string {
    const typeCode =
      input.documentType === 'FACTURA'
        ? '01'
        : input.documentType === 'BOLETA'
          ? '03'
          : input.documentType === 'NOTA_CREDITO'
            ? '07'
            : '08';
    const linesXml = input.lines
      .map(
        (line) => `
    <cac:InvoiceLine>
      <cbc:ID>${line.lineNumber}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="NIU">${line.cantidad}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${input.moneda}">${line.subtotalLinea}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${input.moneda}">${line.igvLinea}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${input.moneda}">${line.subtotalLinea}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${input.moneda}">${line.igvLinea}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">${line.taxAffectationCodigo ?? '10'}</cbc:ID>
            <cbc:Percent>18.00</cbc:Percent>
            <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item><cbc:Description>${this.escape(line.descripcion)}</cbc:Description></cac:Item>
      <cac:Price><cbc:PriceAmount currencyID="${input.moneda}">${line.precioUnitario}</cbc:PriceAmount></cac:Price>
    </cac:InvoiceLine>`,
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${input.serie}-${input.numero}</cbc:ID>
  <cbc:IssueDate>${input.fechaEmision.slice(0, 10)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">${typeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${input.moneda}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="6">${input.emisorRuc}</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${this.escape(input.emisorRazonSocial)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="${input.receptorTipoDoc}">${input.receptorNumeroDoc}</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${this.escape(input.receptorNombre)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${input.moneda}">${input.igvTotal}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${input.moneda}">${input.subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${input.moneda}">${input.total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${input.moneda}">${input.total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${linesXml}
</Invoice>`;
  }

  buildCreditNote(input: {
    serie: string;
    numero: string;
    fechaEmision: string;
    moneda: string;
    emisorRuc: string;
    emisorRazonSocial: string;
    receptorTipoDoc: string;
    receptorNumeroDoc: string;
    receptorNombre: string;
    subtotal: string;
    igvTotal: string;
    total: string;
    relatedDocumentType: 'FACTURA' | 'BOLETA';
    relatedSerie: string;
    relatedNumero: string;
    discrepancyReason: string;
    lines: Array<{
      lineNumber: number;
      descripcion: string;
      cantidad: string;
      precioUnitario: string;
      subtotalLinea: string;
      igvLinea: string;
      totalLinea: string;
      taxAffectationCodigo?: string | null;
    }>;
  }): string {
    const relatedTypeCode = input.relatedDocumentType === 'FACTURA' ? '01' : '03';
    const linesXml = input.lines
      .map(
        (line) => `
    <cac:CreditNoteLine>
      <cbc:ID>${line.lineNumber}</cbc:ID>
      <cbc:CreditedQuantity unitCode="NIU">${line.cantidad}</cbc:CreditedQuantity>
      <cbc:LineExtensionAmount currencyID="${input.moneda}">${line.subtotalLinea}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${input.moneda}">${line.igvLinea}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${input.moneda}">${line.subtotalLinea}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${input.moneda}">${line.igvLinea}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">${line.taxAffectationCodigo ?? '10'}</cbc:ID>
            <cbc:Percent>18.00</cbc:Percent>
            <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item><cbc:Description>${this.escape(line.descripcion)}</cbc:Description></cac:Item>
      <cac:Price><cbc:PriceAmount currencyID="${input.moneda}">${line.precioUnitario}</cbc:PriceAmount></cac:Price>
    </cac:CreditNoteLine>`,
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${input.serie}-${input.numero}</cbc:ID>
  <cbc:IssueDate>${input.fechaEmision.slice(0, 10)}</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>${input.moneda}</cbc:DocumentCurrencyCode>
  <cac:DiscrepancyResponse>
    <cbc:ReferenceID>${input.relatedSerie}-${input.relatedNumero}</cbc:ReferenceID>
    <cbc:ResponseCode>09</cbc:ResponseCode>
    <cbc:Description>${this.escape(input.discrepancyReason)}</cbc:Description>
  </cac:DiscrepancyResponse>
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${input.relatedSerie}-${input.relatedNumero}</cbc:ID>
      <cbc:DocumentTypeCode>${relatedTypeCode}</cbc:DocumentTypeCode>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="6">${input.emisorRuc}</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${this.escape(input.emisorRazonSocial)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="${input.receptorTipoDoc}">${input.receptorNumeroDoc}</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${this.escape(input.receptorNombre)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${input.moneda}">${input.igvTotal}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${input.moneda}">${input.subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${input.moneda}">${input.total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${input.moneda}">${input.total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${linesXml}
</CreditNote>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
