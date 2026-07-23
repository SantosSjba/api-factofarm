import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { normalizeTimeZone } from '../../../common/utils/timezone.util';

export type SalePdfFormatOption = 'TICKET_80' | 'TICKET_58' | 'A4';

export type SalePdfLine = {
  descripcion: string;
  cantidad: string;
  totalLinea: string;
  /** Precio unitario opcional (para ticket: cant × p.unit). */
  precioUnitario?: string;
  lotes?: string;
};

export type SalePdfInput = {
  documentLabel: string;
  serie: string | null;
  numero: string | null;
  issuedAt: Date;
  /** Zona IANA del establecimiento (default America/Lima). */
  timeZone?: string;
  establishmentName: string;
  rucEmisor: string | null;
  address?: string | null;
  phone?: string | null;
  customerName: string | null;
  customerDoc: string | null;
  subtotal: string;
  igvTotal: string;
  descuentoTotal: string;
  total: string;
  payments: Array<{ metodo: string; monto: string; referencia?: string | null }>;
  lines: SalePdfLine[];
  footerNote: string;
  /** Logo del establecimiento (PNG/JPEG). Si falta, se usa el logo FactoFarm. */
  logoBuffer?: Buffer | null;
  /** Formato configurado por el cliente SaaS (default ticket 80 mm). */
  format?: SalePdfFormatOption;
};

const MM_TO_PT = 72 / 25.4;

@Injectable()
export class SalePdfService {
  async build(input: SalePdfInput): Promise<Buffer> {
    const format = input.format ?? 'TICKET_80';
    if (format === 'A4') {
      return this.buildA4(input);
    }
    return this.buildTicket(input, format === 'TICKET_58' ? 58 : 80);
  }

  private async buildTicket(input: SalePdfInput, paperWidthMm: 58 | 80): Promise<Buffer> {
    const pageWidth = paperWidthMm * MM_TO_PT;
    const margin = paperWidthMm === 58 ? 8 : 10;
    const contentWidth = pageWidth - margin * 2;
    const fontSize = paperWidthMm === 58 ? 7 : 8;
    const titleSize = paperWidthMm === 58 ? 9 : 10;
    const totalSize = paperWidthMm === 58 ? 10 : 11;

    const logoBuffer = await this.resolveLogoBuffer(input.logoBuffer);
    const pageHeight = this.estimateTicketHeight(input, !!logoBuffer, paperWidthMm);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [pageWidth, pageHeight],
        margin,
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const comp =
        `${input.serie ?? ''}-${input.numero ?? ''}`.replace(/^-|-$/g, '') || 'S/N';

      const dashedLine = () => {
        const y = doc.y;
        doc
          .save()
          .strokeColor('#333333')
          .lineWidth(0.5)
          .dash(2, { space: 2 })
          .moveTo(margin, y)
          .lineTo(pageWidth - margin, y)
          .stroke()
          .undash()
          .restore();
        doc.moveDown(0.35);
      };

      if (logoBuffer) {
        const logoMaxH = paperWidthMm === 58 ? 28 : 36;
        const logoY = doc.y;
        try {
          doc.image(logoBuffer, margin, logoY, {
            fit: [contentWidth, logoMaxH],
            align: 'center',
            valign: 'center',
          });
          doc.y = logoY + logoMaxH + 4;
        } catch {
          /* buffer no soportado */
        }
      }

      doc
        .fontSize(titleSize)
        .font('Helvetica-Bold')
        .text(input.establishmentName || 'FactoFarm', margin, doc.y, {
          width: contentWidth,
          align: 'center',
        });

      doc.font('Helvetica').fontSize(fontSize);
      if (input.rucEmisor) {
        doc.text(`RUC ${input.rucEmisor}`, { width: contentWidth, align: 'center' });
      }
      if (input.address) {
        doc.text(input.address, { width: contentWidth, align: 'center' });
      }
      if (input.phone) {
        doc.text(`Tel. ${input.phone}`, { width: contentWidth, align: 'center' });
      }

      doc.moveDown(0.35);
      dashedLine();

      doc
        .font('Helvetica-Bold')
        .fontSize(titleSize)
        .text(input.documentLabel, { width: contentWidth, align: 'center' });
      doc
        .font('Helvetica-Bold')
        .fontSize(fontSize + 1)
        .text(comp, { width: contentWidth, align: 'center' });
      doc
        .font('Helvetica')
        .fontSize(fontSize)
        .fillColor('#333333')
        .text(
          input.issuedAt.toLocaleString('es-PE', {
            timeZone: normalizeTimeZone(input.timeZone),
          }),
          {
          width: contentWidth,
          align: 'center',
        })
        .fillColor('#000000');

      doc.moveDown(0.3);
      dashedLine();

      if (input.customerName) {
        doc.font('Helvetica').fontSize(fontSize);
        doc.text(`Cliente: ${input.customerName}`, { width: contentWidth });
        if (input.customerDoc) {
          doc.text(`Doc: ${input.customerDoc}`, { width: contentWidth });
        }
        doc.moveDown(0.25);
        dashedLine();
      }

      for (const line of input.lines) {
        doc.font('Helvetica').fontSize(fontSize);
        doc.text(line.descripcion, margin, doc.y, {
          width: contentWidth,
          align: 'left',
        });
        const qtyPrice = line.precioUnitario
          ? `${line.cantidad} x ${line.precioUnitario}`
          : `Cant. ${line.cantidad}`;
        const rowY = doc.y;
        doc.text(qtyPrice, margin, rowY, { width: contentWidth * 0.55, align: 'left' });
        doc.text(`S/ ${line.totalLinea}`, margin + contentWidth * 0.45, rowY, {
          width: contentWidth * 0.55,
          align: 'right',
        });
        doc.y = rowY + fontSize + 2;
        if (line.lotes) {
          doc
            .fillColor('#555555')
            .fontSize(fontSize - 1)
            .text(`Lote: ${line.lotes}`, { width: contentWidth });
          doc.fillColor('#000000').fontSize(fontSize);
        }
        doc.moveDown(0.2);
      }

      dashedLine();

      const moneyRow = (label: string, value: string, bold = false) => {
        const y = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? totalSize : fontSize);
        doc.text(label, margin, y, { width: contentWidth * 0.55 });
        doc.text(`S/ ${value}`, margin + contentWidth * 0.4, y, {
          width: contentWidth * 0.6,
          align: 'right',
        });
        doc.moveDown(0.25);
      };

      if (Number(input.descuentoTotal) > 0) {
        moneyRow('Descuento', input.descuentoTotal);
      }
      moneyRow('Subtotal', input.subtotal);
      moneyRow('IGV', input.igvTotal);
      moneyRow('TOTAL', input.total, true);

      if (input.payments.length) {
        doc.moveDown(0.2);
        dashedLine();
        doc.font('Helvetica-Bold').fontSize(fontSize).text('Pagos', { width: contentWidth });
        doc.font('Helvetica').fontSize(fontSize);
        for (const p of input.payments) {
          const ref = p.referencia ? ` · ${p.referencia}` : '';
          doc.text(`${p.metodo}: S/ ${p.monto}${ref}`, { width: contentWidth });
        }
      }

      doc.moveDown(0.4);
      dashedLine();
      doc
        .font('Helvetica')
        .fontSize(fontSize - 1)
        .fillColor('#444444')
        .text(input.footerNote, margin, doc.y, {
          width: contentWidth,
          align: 'center',
          lineGap: 1,
        });
      doc.moveDown(0.25);
      doc.text('Gracias por su compra', margin, doc.y, {
        width: contentWidth,
        align: 'center',
      });
      doc.moveDown(0.15);
      doc
        .text('FactoFarm', margin, doc.y, { width: contentWidth, align: 'center' })
        .fillColor('#000000');

      doc.end();
    });
  }

  private async buildA4(input: SalePdfInput): Promise<Buffer> {
    const logoBuffer = await this.resolveLogoBuffer(input.logoBuffer);
    const margin = 48;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const comp =
        `${input.serie ?? ''}-${input.numero ?? ''}`.replace(/^-|-$/g, '') || 'S/N';
      const pageInnerWidth = 595.28 - margin * 2;

      if (logoBuffer) {
        const logoY = doc.y;
        try {
          doc.image(logoBuffer, margin, logoY, {
            fit: [160, 48],
            valign: 'center',
          });
          doc.y = logoY;
        } catch {
          /* ignore */
        }
      }

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(input.establishmentName || 'FactoFarm', {
          align: 'center',
        });
      if (input.rucEmisor) {
        doc.fontSize(10).font('Helvetica').text(`RUC ${input.rucEmisor}`, { align: 'center' });
      }
      if (input.address) {
        doc.fontSize(9).fillColor('#444444').text(input.address, { align: 'center' });
      }
      if (input.phone) {
        doc.fontSize(9).text(`Tel. ${input.phone}`, { align: 'center' });
      }
      doc.fillColor('#000000');
      doc.moveDown(0.5);
      doc.fontSize(13).font('Helvetica-Bold').text(input.documentLabel, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(comp, { align: 'center' });
      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(
          input.issuedAt.toLocaleString('es-PE', {
            timeZone: normalizeTimeZone(input.timeZone),
          }),
          {
          align: 'center',
        });
      doc.fillColor('#000000');
      doc.moveDown();

      if (input.customerName) {
        doc.fontSize(10).font('Helvetica-Bold').text('Cliente');
        doc.font('Helvetica').text(input.customerName);
        if (input.customerDoc) doc.text(`Documento: ${input.customerDoc}`);
        doc.moveDown();
      }

      doc.fontSize(10).font('Helvetica-Bold');
      const colDesc = margin;
      const colCant = 360;
      const colTotal = 460;
      let y = doc.y;
      doc.text('Producto', colDesc, y, { width: 300 });
      doc.text('Cant.', colCant, y, { width: 60, align: 'right' });
      doc.text('Total', colTotal, y, { width: 80, align: 'right' });
      y = doc.y + 4;
      doc
        .moveTo(margin, y)
        .lineTo(margin + pageInnerWidth, y)
        .strokeColor('#cccccc')
        .stroke();
      doc.strokeColor('#000000');
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(9);

      for (const line of input.lines) {
        if (doc.y > 720) {
          doc.addPage();
        }
        const rowY = doc.y;
        doc.text(line.descripcion, colDesc, rowY, { width: 300 });
        const afterDesc = doc.y;
        doc.text(line.cantidad, colCant, rowY, { width: 60, align: 'right' });
        doc.text(`S/ ${line.totalLinea}`, colTotal, rowY, { width: 80, align: 'right' });
        doc.y = Math.max(afterDesc, rowY + 12);
        if (line.lotes) {
          doc.fillColor('#666666').fontSize(8).text(`Lotes: ${line.lotes}`, colDesc, doc.y, {
            width: 300,
          });
          doc.fillColor('#000000').fontSize(9);
        }
        doc.moveDown(0.35);
      }

      doc.moveDown(0.5);
      doc
        .moveTo(320, doc.y)
        .lineTo(margin + pageInnerWidth, doc.y)
        .strokeColor('#cccccc')
        .stroke();
      doc.strokeColor('#000000');
      doc.moveDown(0.4);

      const moneyRow = (label: string, value: string, bold = false) => {
        const yy = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 10);
        doc.text(label, 320, yy, { width: 120, align: 'right' });
        doc.text(`S/ ${value}`, 450, yy, { width: 90, align: 'right' });
        doc.moveDown(0.35);
      };

      if (Number(input.descuentoTotal) > 0) {
        moneyRow('Descuento', input.descuentoTotal);
      }
      moneyRow('Subtotal', input.subtotal);
      moneyRow('IGV', input.igvTotal);
      moneyRow('Total', input.total, true);

      if (input.payments.length) {
        doc.moveDown(0.6);
        doc.fontSize(10).font('Helvetica-Bold').text('Pagos', margin);
        doc.font('Helvetica').fontSize(9);
        for (const p of input.payments) {
          const ref = p.referencia ? ` · ${p.referencia}` : '';
          doc.text(`${p.metodo}: S/ ${p.monto}${ref}`);
        }
      }

      doc.moveDown(1.2);
      doc
        .fontSize(8)
        .fillColor('#555555')
        .text(input.footerNote, { align: 'center' });
      doc
        .moveDown(0.3)
        .text('Documento generado por FactoFarm', { align: 'center' });

      doc.end();
    });
  }

  private estimateTicketHeight(
    input: SalePdfInput,
    hasLogo: boolean,
    paperWidthMm: 58 | 80,
  ): number {
    const lineChars = paperWidthMm === 58 ? 28 : 36;
    let h = paperWidthMm === 58 ? 16 : 20;
    h += hasLogo ? (paperWidthMm === 58 ? 34 : 44) : 0;
    h += 70;
    if (input.address) h += 14;
    if (input.phone) h += 12;
    if (input.customerName) h += 28;
    for (const line of input.lines) {
      const wraps = Math.max(1, Math.ceil(line.descripcion.length / lineChars));
      h += wraps * 10 + 14;
      if (line.lotes) h += 10;
    }
    h += 55;
    h += input.payments.length ? 14 + input.payments.length * 11 : 0;
    const footerWraps = Math.max(2, Math.ceil((input.footerNote?.length ?? 40) / lineChars));
    h += footerWraps * 10 + 50;
    // Margen extra para que no se corten las últimas líneas del ticket
    return Math.max(h + 36, paperWidthMm === 58 ? 300 : 340);
  }

  private async resolveLogoBuffer(tenantLogo?: Buffer | null): Promise<Buffer | null> {
    if (tenantLogo?.length && this.isRasterImage(tenantLogo)) {
      return tenantLogo;
    }
    return this.loadSystemLogo();
  }

  private isRasterImage(buf: Buffer): boolean {
    if (buf.length < 8) return false;
    const isPng =
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    return isPng || isJpeg;
  }

  private async loadSystemLogo(): Promise<Buffer | null> {
    const candidates = [
      join(process.cwd(), 'assets/branding/factofarm-logo.png'),
      join(__dirname, '../../../../../assets/branding/factofarm-logo.png'),
      join(__dirname, '../../../../assets/branding/factofarm-logo.png'),
    ];
    for (const path of candidates) {
      if (!existsSync(path)) continue;
      try {
        return await readFile(path);
      } catch {
        /* try next */
      }
    }
    return null;
  }
}
