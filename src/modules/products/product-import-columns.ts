import { DATE_HELP, type ImportColumn } from '../../common/utils/import-template.util';

/**
 * Columnas de las plantillas de importación de productos. `key` es lo que lee
 * `ProductsService` (no cambiar); `header` es lo que ve el usuario.
 */

const SI_NO = 'SI o NO.';
const UNIT_HELP = 'Código SUNAT de la unidad: NIU = unidad, BX = caja, ZZ = servicio… Los ves en Productos → Unidades.';
const TAX_HELP = 'Código SUNAT: 10 = gravado (lo habitual), 20 = exonerado, 30 = inafecto. Si dudas, consúltalo con tu contador.';

export const PRODUCT_ITEMS_COLUMNS: ImportColumn[] = [
  { key: 'Nombre', header: 'Nombre', required: true, help: 'Nombre con el que lo vendes y que sale en los comprobantes.', example: 'PARACETAMOL 500 MG X 100 TAB' },
  { key: 'Código Interno', header: 'Código interno', required: true, help: 'Tu código para el producto. Si ya existe un producto con este código, se actualiza; si no, se crea.', example: 'P0001' },
  { key: 'Código Tipo de Unidad', header: 'Unidad (código SUNAT)', required: true, help: UNIT_HELP, example: 'NIU' },
  { key: 'Código Tipo de Moneda', header: 'Moneda', required: true, help: 'PEN para soles o USD para dólares.', example: 'PEN' },
  { key: 'Precio Unitario Venta', header: 'Precio de venta', required: true, help: 'Lo que cobras por una unidad. Puedes usar punto o coma para los decimales.', example: 12.5 },
  { key: 'Codigo Tipo de Afectación del Igv Venta', header: 'IGV en la venta (código)', aliases: ['Código Tipo de Afectación del Igv Venta'], required: true, help: TAX_HELP, example: 10 },
  { key: 'Tiene Igv', header: 'Precio incluye IGV', help: `${SI_NO} Si lo dejas vacío, se toma SI.`, example: 'SI' },
  { key: 'Precio Unitario Compra', header: 'Precio de compra', help: 'Lo que te cuesta una unidad.', example: 8.2 },
  { key: 'Codigo Tipo de Afectación del Igv Compra', header: 'IGV en la compra (código)', aliases: ['Código Tipo de Afectación del Igv Compra'], help: 'Igual que el de la venta. Si lo dejas vacío, se usa el de la venta.', example: 10 },
  { key: 'Stock', header: 'Stock inicial', help: 'Unidades que tienes hoy. Solo se carga al crear el producto; en productos que ya existen el stock no cambia. Entra al almacén principal.', example: 20 },
  { key: 'Stock Mínimo', header: 'Stock mínimo', help: 'Cuando el stock baja de este número, sale en las alertas de stock bajo. Si lo dejas vacío, se toma 1.', example: 5 },
  { key: 'Código lote', header: 'Código de lote', help: 'Solo si controlas lotes y cargas stock inicial: el lote de ese stock. Con lote o vencimiento, el producto queda con manejo de lotes.', example: 'L2401' },
  { key: 'Fec. Vencimiento', header: 'Fecha de vencimiento', aliases: ['Fecha vencimiento'], help: `Vencimiento de ese lote. ${DATE_HELP}`, example: '31/12/2027' },
  { key: 'Categoria', header: 'Categoría', help: 'Nombre de la categoría. Si no existe, se crea.', example: 'MEDICAMENTOS' },
  { key: 'Marca', header: 'Marca / Laboratorio', help: 'Nombre de la marca o laboratorio. Si no existe, se crea.', example: 'GENFAR' },
  { key: 'Descripcion', header: 'Descripción', help: 'Detalle adicional. Opcional.', example: 'Caja x 100 tabletas' },
  { key: 'Principio Activo', header: 'Principio activo', help: 'Sustancia que produce el efecto.', example: 'PARACETAMOL' },
  { key: 'Concentración', header: 'Concentración', help: 'Cantidad de principio activo.', example: '500 MG' },
  { key: 'Presentación', header: 'Forma farmacéutica', help: 'Cómo se presenta: tableta, jarabe, ampolla…', example: 'TABLETA' },
  { key: 'Registro Sanitario', header: 'Registro sanitario', help: 'Número que figura en el empaque.', example: 'EN-01234' },
  { key: 'Código Medicamento DIGEMID', header: 'Código DIGEMID', help: 'Código del producto en el catálogo de DIGEMID.', example: '12345' },
  { key: 'Es Generico', header: 'Es genérico', help: `${SI_NO} Si lo dejas vacío, se toma NO.`, example: 'SI' },
  { key: 'Cód barras', header: 'Código de barras', aliases: ['Código de barra', 'Cod barras'], help: 'El código impreso en el empaque.', example: '7751234567890' },
  { key: 'Código Sunat', header: 'Código SUNAT del producto', help: 'Código del catálogo de productos de SUNAT. Opcional.', example: '51142001' },
  { key: 'Modelo', header: 'Modelo', help: 'Solo para equipos o dispositivos. Opcional.', example: '' },
  { key: 'Ubicación', header: 'Ubicación', help: 'Estante o lugar donde está. Si no existe, se crea.', example: 'ESTANTE A1' },
];

export const PRODUCT_PRICE_LIST_COLUMNS: ImportColumn[] = [
  { key: 'Código Interno (Producto)', header: 'Código interno del producto', required: true, help: 'Código interno del producto que ya existe y al que le agregas la presentación.', example: 'P0001' },
  { key: 'Código Tipo de Unidad', header: 'Unidad de la presentación (código SUNAT)', required: true, help: UNIT_HELP, example: 'BX' },
  { key: 'Descripcion', header: 'Descripción', help: 'Cómo se llama la presentación al venderla.', example: 'Caja x 100' },
  { key: 'Factor', header: 'Unidades que contiene', aliases: ['Factor'], required: true, help: 'Cuántas unidades del producto trae. Ej.: una caja de 100 tabletas = 100. Al venderla se descuentan del stock.', example: 100 },
  { key: 'Precio 1', header: 'Precio 1', required: true, help: 'Primer precio de la presentación, por ejemplo el de público.', example: 45 },
  { key: 'Precio 2', header: 'Precio 2', required: true, help: 'Segundo precio, por ejemplo el de mayorista.', example: 42 },
  { key: 'Precio 3', header: 'Precio 3', required: true, help: 'Tercer precio, por ejemplo uno especial.', example: 40 },
  { key: 'Precio por defecto', header: 'Precio que se usa (1, 2 o 3)', aliases: ['Precio por defecto'], help: 'Cuál de los tres precios se usa al vender. Si lo dejas vacío, se toma 1.', example: 1 },
];

/** Los nombres antiguos (medcod, prdpreadq…) los sigue leyendo el importador directamente. */
export const PRODUCT_UPDATE_PRICES_COLUMNS: ImportColumn[] = [
  { key: 'Código Interno', header: 'Código interno', required: true, help: 'Código interno del producto que ya existe. Los que no se encuentren aparecen como error y no se tocan.', example: 'P0001' },
  { key: 'Nombre', header: 'Producto (solo referencia)', help: 'Para que reconozcas la fila. No se importa ni cambia el nombre.', example: 'PARACETAMOL 500 MG X 100 TAB' },
  { key: 'Precio Unitario Venta', header: 'Precio de venta', required: true, help: 'Nuevo precio de venta por unidad.', example: 13 },
  { key: 'Precio Unitario Compra (Opcional)', header: 'Precio de compra', aliases: ['Precio Unitario Compra'], help: 'Nuevo precio de compra. Si lo dejas vacío, no cambia.', example: 8.5 },
];
