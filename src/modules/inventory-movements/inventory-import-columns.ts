import { DATE_HELP, type ImportColumn } from '../../common/utils/import-template.util';

/** Columnas de las plantillas de Inventario. `key` es lo que lee el importador (no cambiar). */
export const LOT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'Código Interno', header: 'Código interno del producto', aliases: ['Código interno'], required: true, help: 'Código interno del producto, que ya debe existir.', example: 'P0001' },
  { key: 'Código Lote', header: 'Código de lote', required: true, help: 'Lote nuevo. Si el lote ya existe, solo se actualiza su vencimiento (el stock no se cambia por importación).', example: 'L2401' },
  { key: 'Stock', header: 'Cantidad', aliases: ['Stock'], required: true, help: 'Unidades de ese lote que entran al almacén elegido al importar.', example: 40 },
  { key: 'Fec. Vencimiento', header: 'Fecha de vencimiento', aliases: ['Fecha vencimiento'], help: `Vencimiento del lote. ${DATE_HELP}`, example: '31/12/2027' },
];

export const SERIES_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'Código Interno', header: 'Código interno del producto', aliases: ['Código interno'], required: true, help: 'Código interno del producto, que ya debe existir.', example: 'P0002' },
  { key: 'Serie', header: 'Número de serie', aliases: ['Serie'], required: true, help: 'Número de serie de la unidad. Una fila por cada unidad.', example: 'SN-000123' },
  { key: 'Estado', header: 'Estado', help: 'Disponible, Vendido, Reservado o Anulado. Si lo dejas vacío, queda Disponible.', example: 'Disponible' },
  { key: 'Fecha', header: 'Fecha de ingreso', aliases: ['Fecha'], help: `Fecha en que entró la unidad. ${DATE_HELP}`, example: '15/01/2026' },
];
