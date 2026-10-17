import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { formatDateTimeInTimeZone } from '../../common/utils/timezone.util';
import type { CashRegistersService } from './cash-registers.service';
import type { CashSessionListItem } from './cash-sessions-history.service';

type SessionSummary = Awaited<
  ReturnType<CashRegistersService['sessionSummary']>
>;
type Paper = 'A4' | 'TICKET_80' | 'TICKET_58';

const MM_TO_PT = 72 / 25.4;

const MOVEMENT_LABELS: Record<string, string> = {
  APERTURA: 'Apertura',
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
  VENTA: 'Venta',
  ANULACION: 'Anulación',
  CIERRE: 'Cierre',
};

function money(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  return `S/ ${Number(value).toFixed(2)}`;
}

function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/** PDFs de caja: reporte de cierre / arqueo (A4 o ticket) e historial de sesiones. */
@Injectable()
export class CashReportPdfService {
  async buildSessionReport(s: SessionSummary, paper: Paper): Promise<Buffer> {
    const ticket = paper !== 'A4';
    const width = paper === 'TICKET_58' ? 58 * MM_TO_PT : 80 * MM_TO_PT;
    const margin = ticket ? (paper === 'TICKET_58' ? 8 : 10) : 40;
    const fs = ticket ? (paper === 'TICKET_58' ? 7 : 8) : 10;
    const tz = s.establishment.timeZone;
    const fmt = (iso: string | null) =>
      iso
        ? formatDateTimeInTimeZone(new Date(iso), tz, 'es-PE', {
            timeStyle: 'short',
          })
        : '—';

    const methods = Object.entries(s.totalesPorMetodo);
    const manual = s.movimientos.filter(
      (m) => m.tipo === 'INGRESO' || m.tipo === 'EGRESO',
    );
    // Altura estimada del ticket: cabecera + filas.
    const ticketHeight =
      (32 +
        methods.length +
        manual.length * 2 +
        (s.motivoCierreForzado ? 4 : 0) +
        (s.notasCierre ? 4 : 0)) *
        (fs + 4) +
      80;

    const doc = new PDFDocument(
      ticket ? { size: [width, ticketHeight], margin } : { size: 'A4', margin },
    );
    const done = collect(doc);
    const contentWidth = doc.page.width - margin * 2;

    const labelShare = ticket ? 0.48 : 0.6;
    const row = (label: string, value: string, bold = false) => {
      const y = doc.y;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fs);
      doc.text(label, margin, y, { width: contentWidth * labelShare });
      const yAfterLabel = doc.y;
      doc.text(value, margin + contentWidth * labelShare, y, {
        width: contentWidth * (1 - labelShare),
        align: 'right',
      });
      doc.y = Math.max(yAfterLabel, doc.y);
    };
    const rule = () => {
      doc.moveDown(0.3);
      const y = doc.y;
      doc
        .save()
        .strokeColor('#555555')
        .lineWidth(0.5)
        .dash(2, { space: 2 })
        .moveTo(margin, y)
        .lineTo(margin + contentWidth, y)
        .stroke()
        .undash()
        .restore();
      doc.moveDown(0.4);
    };
    const section = (title: string) => {
      doc.moveDown(0.3);
      doc
        .font('Helvetica-Bold')
        .fontSize(fs + 1)
        .text(title, margin, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
    };

    doc
      .font('Helvetica-Bold')
      .fontSize(fs + (ticket ? 2 : 6))
      .text(s.establishment.nombre, margin, doc.y, {
        width: contentWidth,
        align: 'center',
      });
    doc
      .fontSize(fs + (ticket ? 1 : 3))
      .text(
        s.estado === 'ABIERTA'
          ? 'ESTADO DE CAJA (ABIERTA)'
          : 'ARQUEO / CIERRE DE CAJA',
        { width: contentWidth, align: 'center' },
      );
    if (s.cierreForzado) {
      doc
        .fillColor('#b91c1c')
        .text('CIERRE FORZADO', { width: contentWidth, align: 'center' })
        .fillColor('#000000');
    }
    rule();

    row('Caja', s.cashRegister.nombre);
    row('Cajero', s.user.nombre);
    row('Apertura', fmt(s.openedAt));
    row('Cierre', fmt(s.closedAt));
    row('Horas abierta', `${s.horasAbierta} h`);
    if (s.closedBy) row('Cerrada por', s.closedBy.nombre);
    rule();

    section('Efectivo');
    row('Monto inicial', money(s.resumenEfectivo.apertura));
    row('(+) Ventas en efectivo', money(s.resumenEfectivo.ventasEfectivo));
    row('(+) Ingresos de caja', money(s.resumenEfectivo.ingresos));
    row(
      '(-) Egresos de caja',
      money(Math.abs(Number(s.resumenEfectivo.egresos))),
    );
    if (Number(s.resumenEfectivo.anulaciones) !== 0) {
      row(
        '(-) Anulaciones',
        money(Math.abs(Number(s.resumenEfectivo.anulaciones))),
      );
    }
    row('Efectivo esperado', money(s.efectivoEsperado), true);
    row('Efectivo contado', money(s.montoCierreFisico), true);
    row('Diferencia', money(s.diferenciaArqueo), true);
    if (s.diferenciaArqueo != null && Number(s.diferenciaArqueo) !== 0) {
      doc
        .font('Helvetica')
        .fontSize(fs)
        .text(
          Number(s.diferenciaArqueo) < 0
            ? 'Faltante de caja'
            : 'Sobrante de caja',
          {
            width: contentWidth,
            align: 'right',
          },
        );
    }
    rule();

    section(`Ventas (${s.numVentas})`);
    if (!methods.length) {
      doc
        .font('Helvetica')
        .fontSize(fs)
        .text('Sin ventas en la sesión', { width: contentWidth });
    }
    for (const [metodo, monto] of methods) row(metodo, money(monto));
    row('Total vendido', money(s.totalVentas), true);
    if (s.ventasAnuladas) row('Ventas anuladas', String(s.ventasAnuladas));

    if (manual.length) {
      rule();
      section('Ingresos / egresos de caja chica');
      for (const m of manual) {
        row(
          `${fmt(m.createdAt)} · ${MOVEMENT_LABELS[m.tipo] ?? m.tipo}`,
          money(m.monto),
        );
        if (m.comentario) {
          doc
            .font('Helvetica')
            .fontSize(fs - 1)
            .fillColor('#444444')
            .text(m.comentario, margin, doc.y, { width: contentWidth })
            .fillColor('#000000');
        }
      }
    }

    if (s.notasCierre || s.motivoCierreForzado) {
      rule();
      if (s.motivoCierreForzado) {
        doc
          .font('Helvetica-Bold')
          .fontSize(fs)
          .text('Motivo del cierre forzado:', margin, doc.y, {
            width: contentWidth,
          });
        doc
          .font('Helvetica')
          .text(s.motivoCierreForzado, { width: contentWidth });
      }
      if (s.notasCierre) {
        doc
          .font('Helvetica-Bold')
          .fontSize(fs)
          .text('Observaciones:', margin, doc.y, { width: contentWidth });
        doc.font('Helvetica').text(s.notasCierre, { width: contentWidth });
      }
    }

    if (!ticket && s.movimientos.length) {
      rule();
      section('Movimientos de la sesión');
      for (const m of s.movimientos) {
        row(
          `${fmt(m.createdAt)} · ${MOVEMENT_LABELS[m.tipo] ?? m.tipo} · ${m.metodoPago ?? ''}${m.referencia ? ` · ${m.referencia}` : ''}`,
          money(m.monto),
        );
      }
    }

    doc.moveDown(ticket ? 1.5 : 3);
    const sigY = doc.y;
    const half = contentWidth / 2 - 10;
    doc.font('Helvetica').fontSize(fs);
    if (ticket) {
      doc.text('______________________', margin, sigY, {
        width: contentWidth,
        align: 'center',
      });
      doc.text('Firma cajero', { width: contentWidth, align: 'center' });
      doc.moveDown(1.2);
      doc.text('______________________', {
        width: contentWidth,
        align: 'center',
      });
      doc.text('Firma supervisor', { width: contentWidth, align: 'center' });
    } else {
      doc.text('______________________________', margin, sigY, {
        width: half,
        align: 'center',
      });
      doc.text('______________________________', margin + half + 20, sigY, {
        width: half,
        align: 'center',
      });
      const labelY = doc.y;
      doc.text('Firma cajero', margin, labelY, {
        width: half,
        align: 'center',
      });
      doc.text('Firma supervisor', margin + half + 20, labelY, {
        width: half,
        align: 'center',
      });
    }
    doc.moveDown(0.8);
    doc
      .fontSize(fs - 1)
      .fillColor('#666666')
      .text(
        `Impreso: ${formatDateTimeInTimeZone(new Date(), tz, 'es-PE', { timeStyle: 'short' })}`,
        margin,
        doc.y,
        {
          width: contentWidth,
          align: 'center',
        },
      );

    doc.end();
    return done;
  }

  async buildHistory(input: {
    items: CashSessionListItem[];
    timeZone: string;
    establishmentLabel: string;
    rango: string;
  }): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 30,
    });
    const done = collect(doc);
    const fmt = (iso: string | null) =>
      iso
        ? formatDateTimeInTimeZone(new Date(iso), input.timeZone, 'es-PE', {
            timeStyle: 'short',
          })
        : '—';

    doc.font('Helvetica-Bold').fontSize(14).text('Historial de cajas');
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(
        `${input.establishmentLabel} · Rango: ${input.rango} · ${input.items.length} sesiones`,
      )
      .fillColor('#000000');
    doc.moveDown(0.6);

    const cols: Array<{ title: string; width: number; align?: 'right' }> = [
      { title: 'Apertura', width: 78 },
      { title: 'Cierre', width: 78 },
      { title: 'Caja', width: 90 },
      { title: 'Cajero', width: 95 },
      { title: 'Estado', width: 70 },
      { title: 'Cerrada por', width: 85 },
      { title: 'Inicial', width: 55, align: 'right' },
      { title: 'Ventas', width: 60, align: 'right' },
      { title: 'Esperado', width: 60, align: 'right' },
      { title: 'Contado', width: 60, align: 'right' },
      { title: 'Diferencia', width: 50, align: 'right' },
    ];
    const left = 30;
    const drawRow = (cells: string[], bold = false) => {
      const y = doc.y;
      if (y > doc.page.height - 50) {
        doc.addPage();
      }
      const top = doc.y;
      let x = left;
      let maxY = top;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5);
      cols.forEach((c, i) => {
        doc.text(cells[i] ?? '', x, top, {
          width: c.width - 4,
          align: c.align ?? 'left',
        });
        maxY = Math.max(maxY, doc.y);
        x += c.width;
      });
      doc.y = maxY + 2;
      doc
        .save()
        .strokeColor('#dddddd')
        .lineWidth(0.4)
        .moveTo(left, doc.y)
        .lineTo(x, doc.y)
        .stroke()
        .restore();
      doc.y += 2;
    };

    drawRow(
      cols.map((c) => c.title),
      true,
    );
    let dif = 0;
    for (const r of input.items) {
      dif += Number(r.diferenciaArqueo ?? 0);
      drawRow([
        fmt(r.openedAt),
        fmt(r.closedAt),
        r.cashRegister.nombre,
        r.user.nombre,
        r.estado === 'ABIERTA'
          ? r.pendiente
            ? 'Abierta (+24 h)'
            : 'Abierta'
          : r.cierreForzado
            ? 'Cierre forzado'
            : 'Cerrada',
        r.closedBy?.nombre ?? '—',
        money(r.montoApertura),
        money(r.totalVentas),
        money(r.efectivoEsperado),
        money(r.montoCierreFisico),
        money(r.diferenciaArqueo),
      ]);
    }
    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(`Diferencia acumulada: ${money(dif)}`, left, doc.y);

    doc.end();
    return done;
  }
}
