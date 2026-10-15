import * as XLSX from 'xlsx';

export function writeWorkbookBuffer(workbook: XLSX.WorkBook): Buffer {
  const output: unknown = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
  if (!Buffer.isBuffer(output))
    throw new Error('El archivo Excel generado no es un buffer');
  return output;
}

export function parseSpreadsheetDate(
  serial: number,
): { y: number; m: number; d: number } | null {
  const ssf = XLSX.SSF as { parse_date_code(value: number): unknown };
  const result = ssf.parse_date_code(serial);
  if (!result || typeof result !== 'object') return null;
  if (!('y' in result) || !('m' in result) || !('d' in result)) return null;
  const { y, m, d } = result;
  if (typeof y !== 'number' || typeof m !== 'number' || typeof d !== 'number')
    return null;
  return { y, m, d };
}
