import type { ImportColumn } from '../../common/utils/import-template.util';

/** Columnas de las plantillas de packs. `key` es lo que lee el importador (no cambiar). */
export const COMPOUND_COLUMNS: ImportColumn[] = [
  { key: 'Nombre', header: 'Nombre del pack', aliases: ['Nombre'], required: true, help: 'Nombre con el que se vende el pack o la promoción.', example: 'KIT GRIPE' },
  { key: 'Código Interno', header: 'Código interno', required: true, help: 'Tu código para el pack. Si ya existe uno con este código, se actualiza; si no, se crea.', example: 'KIT001' },
  { key: 'Código Tipo de Unidad', header: 'Unidad (código SUNAT)', required: true, help: 'Código SUNAT de la unidad. Para packs, normalmente NIU (unidad).', example: 'NIU' },
  { key: 'Código Tipo de Moneda', header: 'Moneda', required: true, help: 'PEN para soles o USD para dólares.', example: 'PEN' },
  { key: 'Precio Unitario Venta', header: 'Precio de venta', required: true, help: 'Lo que cobras por el pack completo.', example: 25 },
  { key: 'Codigo Tipo de Afectación del Igv Venta', header: 'IGV en la venta (código)', aliases: ['Código Tipo de Afectación del Igv Venta'], required: true, help: 'Código SUNAT: 10 = gravado (lo habitual), 20 = exonerado, 30 = inafecto.', example: 10 },
  { key: 'Tiene Igv', header: 'Precio incluye IGV', help: 'SI o NO. Si lo dejas vacío, se toma SI.', example: 'SI' },
  { key: 'Precio Unitario Compra', header: 'Precio de compra', help: 'Dato de referencia. El costo real sale de cada producto.', example: '' },
  { key: 'Categoria', header: 'Categoría', help: 'Nombre de la categoría. Si no existe, se crea.', example: 'PROMOCIONES' },
  { key: 'Marca', header: 'Marca / Laboratorio', help: 'Nombre de la marca, si tiene. Si no existe, se crea.', example: '' },
  { key: 'Plataforma', header: 'Plataforma', help: 'Canal al que pertenece, como dato informativo. Si no existe, se crea.', example: '' },
  { key: 'Descripcion', header: 'Descripción', aliases: ['Descripción'], help: 'Detalle adicional. Opcional.', example: 'Paracetamol + vitamina C' },
  { key: 'Nombre secundario', header: 'Nombre secundario', help: 'Otro nombre con el que también lo conoces. Opcional.', example: '' },
  { key: 'Código Sunat', header: 'Código SUNAT del producto', help: 'Código del catálogo de productos de SUNAT. Opcional.', example: '' },
  { key: 'Modelo', header: 'Modelo', help: 'Opcional.', example: '' },
];

export const COMPOUND_DETAIL_COLUMNS: ImportColumn[] = [
  { key: 'Código Interno (Producto compuesto/kit)', header: 'Código interno del pack', aliases: ['Codigo Interno (Producto compuesto/kit)'], required: true, help: 'Código del pack, que ya debe existir (impórtalo antes con la plantilla de packs).', example: 'KIT001' },
  { key: 'Código Interno (Producto individual pertenece al kit)', header: 'Código interno del producto', aliases: ['Codigo Interno (Producto individual pertenece al kit)'], required: true, help: 'Código de un producto que lleva el pack. Una fila por cada producto.', example: 'P0001' },
  { key: 'Cantidad', header: 'Cantidad', required: true, help: 'Cuántas unidades de ese producto lleva cada pack.', example: 2 },
];
