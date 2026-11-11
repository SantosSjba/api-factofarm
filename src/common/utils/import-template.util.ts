import * as XLSX from 'xlsx';
import { writeWorkbookBuffer } from './spreadsheet.util';

/**
 * Una columna de una plantilla de importación Excel.
 *
 * `key` es el nombre que lee el importador (no cambia, para no tocar su lógica);
 * `header` es lo que ve el usuario en la plantilla, en español claro. Al importar
 * se acepta cualquiera de los dos, los `aliases` (nombres de plantillas antiguas)
 * y variantes sin tildes, mayúsculas o espacios de más.
 */
export interface ImportColumn {
  key: string;
  header: string;
  aliases?: string[];
  required?: boolean;
  /** Qué poner en la columna, para la hoja «Instrucciones». */
  help: string;
  example: string | number;
}

/** «Código Interno (Producto)» → «codigo interno producto». */
export function normalizeImportHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Devuelve las filas con los encabezados traducidos a la `key` de cada columna,
 * aceptando el encabezado nuevo, el antiguo y sus variantes. Las columnas que no
 * están en la lista se dejan tal cual (algunos importadores leen nombres antiguos).
 */
export function canonicalizeImportRows(
  rows: Record<string, unknown>[],
  columns: ImportColumn[],
): Record<string, unknown>[] {
  const byName = new Map<string, string>();
  for (const col of columns) {
    for (const name of [col.key, col.header, ...(col.aliases ?? [])]) {
      const norm = normalizeImportHeader(name);
      if (norm && !byName.has(norm)) byName.set(norm, col.key);
    }
  }
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [header, value] of Object.entries(row)) {
      const key = byName.get(normalizeImportHeader(header)) ?? header;
      // Si dos columnas apuntan al mismo dato, gana la que tiene valor.
      if (out[key] === undefined || out[key] === '') out[key] = value;
    }
    return out;
  });
}

/**
 * Plantilla .xlsx con dos hojas: «Datos» (encabezados claros y filas de ejemplo) e
 * «Instrucciones» (qué va en cada columna). «Datos» es la primera hoja, que es la
 * que leen los importadores.
 */
export function buildImportTemplateBuffer(
  columns: ImportColumn[],
  options: { notes?: string[]; extraExamples?: Record<string, string | number>[] } = {},
): Buffer {
  const workbook = XLSX.utils.book_new();

  const headers = columns.map((c) => c.header);
  const exampleRows = [
    columns.map((c) => c.example),
    ...(options.extraExamples ?? []).map((ex) => columns.map((c) => ex[c.key] ?? '')),
  ];
  const data = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  data['!cols'] = columns.map((c) => ({
    wch: Math.min(40, Math.max(12, c.header.length + 2, String(c.example).length + 2)),
  }));
  XLSX.utils.book_append_sheet(workbook, data, 'Datos');

  const help = XLSX.utils.aoa_to_sheet([
    ['Columna', '¿Obligatoria?', 'Qué poner', 'Ejemplo'],
    ...columns.map((c) => [c.header, c.required ? 'Sí' : 'No', c.help, c.example]),
    [],
    ['Recomendaciones'],
    ['Llena tus datos en la hoja «Datos» y borra las filas de ejemplo.'],
    ['No cambies los nombres de las columnas. Puedes dejar vacías las que no son obligatorias.'],
    ...(options.notes ?? []).map((n) => [n]),
  ]);
  help['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 90 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(workbook, help, 'Instrucciones');

  return writeWorkbookBuffer(workbook);
}

/** Texto de ayuda común para fechas: Excel o día/mes/año. */
export const DATE_HELP = 'Fecha en formato de Excel o escrita como día/mes/año (ej. 31/12/2027).';
