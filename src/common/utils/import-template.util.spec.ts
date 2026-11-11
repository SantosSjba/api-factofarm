import * as XLSX from 'xlsx';
import {
  buildImportTemplateBuffer,
  canonicalizeImportRows,
  normalizeImportHeader,
  type ImportColumn,
} from './import-template.util';

const COLUMNS: ImportColumn[] = [
  { key: 'Código Interno', header: 'Código interno', aliases: ['medcod'], required: true, help: 'Código', example: 'P1' },
  { key: 'Precio Unitario Venta', header: 'Precio de venta', required: true, help: 'Precio', example: 10 },
  { key: 'Codigo Tipo de Afectación del Igv Venta', header: 'IGV en la venta (código)', help: 'IGV', example: 10 },
];

describe('import-template.util', () => {
  it('normaliza tildes, mayúsculas y signos', () => {
    expect(normalizeImportHeader('  Código  Interno (Producto) ')).toBe('codigo interno producto');
  });

  it('traduce encabezados nuevos, antiguos y sin tildes a la clave del importador', () => {
    const rows = canonicalizeImportRows(
      [
        { 'Código interno': 'A', 'Precio de venta': 5 },
        { medcod: 'B', 'PRECIO UNITARIO VENTA': 6 },
        { 'codigo interno': 'C', 'Codigo Tipo de Afectacion del Igv Venta': 20 },
      ],
      COLUMNS,
    );
    expect(rows[0]).toEqual({ 'Código Interno': 'A', 'Precio Unitario Venta': 5 });
    expect(rows[1]).toEqual({ 'Código Interno': 'B', 'Precio Unitario Venta': 6 });
    expect(rows[2]).toEqual({ 'Código Interno': 'C', 'Codigo Tipo de Afectación del Igv Venta': 20 });
  });

  it('deja intactas las columnas desconocidas y prefiere la que trae valor', () => {
    const [row] = canonicalizeImportRows([{ 'Código interno': '', medcod: 'X', prdpreadq: 1 }], COLUMNS);
    expect(row).toEqual({ 'Código Interno': 'X', prdpreadq: 1 });
  });

  it('genera la plantilla con hoja de datos primero e instrucciones después', () => {
    const wb = XLSX.read(buildImportTemplateBuffer(COLUMNS), { type: 'buffer' });
    expect(wb.SheetNames).toEqual(['Datos', 'Instrucciones']);
    const [headers] = XLSX.utils.sheet_to_json<string[]>(wb.Sheets['Datos'], { header: 1 });
    expect(headers).toEqual(['Código interno', 'Precio de venta', 'IGV en la venta (código)']);
    const help = XLSX.utils.sheet_to_json<string[]>(wb.Sheets['Instrucciones'], { header: 1 });
    expect(help[1]).toEqual(['Código interno', 'Sí', 'Código', 'P1']);
  });
});
