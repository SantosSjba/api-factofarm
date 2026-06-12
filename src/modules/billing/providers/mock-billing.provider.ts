import { Injectable } from '@nestjs/common';
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

@Injectable()
export class MockBillingProvider implements IBillingProvider {
  async emit(input: EmitDocumentInput): Promise<EmitDocumentResult> {
    const externalId = `MOCK-${input.serie}-${input.numero}-${Date.now()}`;
    const signedXml = `${input.ublXml}\n<!-- XMLDSig: firmado por OSE mock -->`;
    const pdfContent = Buffer.from(
      `FactoFarm CPE\n${input.documentType} ${input.serie}-${input.numero}\nTotal: ${input.total} ${input.moneda}`,
      'utf8',
    );
    const cdrContent = Buffer.from(
      `CDR MOCK ACEPTADO\nCodigo: 0\nDescripcion: La Factura ha sido aceptada`,
      'utf8',
    );
    return {
      externalId,
      sunatStatus: SunatDocumentStatus.ACEPTADO,
      sunatCodigo: '0',
      sunatDescripcion: 'Aceptado (mock OSE)',
      xmlContent: signedXml,
      pdfContent,
      cdrContent,
    };
  }

  async getStatus(externalId: string): Promise<DocumentStatusResult> {
    return {
      sunatStatus: SunatDocumentStatus.ACEPTADO,
      sunatCodigo: '0',
      sunatDescripcion: `Estado mock para ${externalId}`,
    };
  }

  async voidDocument(input: VoidDocumentInput): Promise<VoidDocumentResult> {
    return {
      sunatStatus: SunatDocumentStatus.ANULADO,
      sunatCodigo: '0',
      sunatDescripcion: `Baja registrada mock ${input.serie}-${input.numero}`,
    };
  }

  async sendDailySummary(input: DailySummaryInput): Promise<DailySummaryResult> {
    return {
      externalId: `RC-MOCK-${input.fecha}`,
      sunatStatus: SunatDocumentStatus.ACEPTADO,
      sunatCodigo: '0',
      sunatDescripcion: `Resumen diario mock (${input.documentIds.length} docs)`,
    };
  }
}
