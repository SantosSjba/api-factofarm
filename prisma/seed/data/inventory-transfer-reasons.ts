import type { SeedInventoryTransferReasonInput } from '../types';

export const inventoryTransferReasonsSeed: SeedInventoryTransferReasonInput[] = [
  { codigo: 'COMPRA_NACIONAL', nombre: 'Compra nacional' },
  { codigo: 'CONSIGNACION_RECIBIDA', nombre: 'Consignación recibida' },
  { codigo: 'DEVOLUCION_RECIBIDA', nombre: 'Devolución recibida' },
  { codigo: 'INVENTARIO_INICIAL', nombre: 'Inventario inicial' },
  { codigo: 'ENTRADA_IMPORTACION', nombre: 'Entrada de importación' },
  { codigo: 'INGRESO_PRODUCCION', nombre: 'Ingreso de producción' },
  { codigo: 'DEVOLUCION_PRODUCCION', nombre: 'Entrada por devolución de producción' },
  { codigo: 'TRANSFERENCIA_ALMACENES', nombre: 'Entrada por transferencia entre almacenes' },
  { codigo: 'IDENTIFICACION_ERRONEA', nombre: 'Entrada por identificación erronea' },
  { codigo: 'DEVOLUCION_CLIENTE', nombre: 'Entrada por devolución del cliente' },
  { codigo: 'SERVICIO_PRODUCCION', nombre: 'Entrada para servicio de producción' },
  { codigo: 'BIENES_PRESTAMO', nombre: 'Entrada de bienes en prestamo' },
  { codigo: 'BIENES_CUSTODIA', nombre: 'Entrada de bienes en custodia' },
  { codigo: 'INGRESO_TEMPORAL', nombre: 'Ingreso temporal' },
  { codigo: 'INGRESO_TRANSFORMACION', nombre: 'Ingreso por transformación' },
  { codigo: 'CONVERSION_MEDIDA', nombre: 'Entrada por conversión de medida' },
  { codigo: 'INGRESO_OTROS', nombre: 'Otros' },
  { codigo: 'INSUMOS_MOLINO', nombre: 'Ingreso insumos por molino' },
  { codigo: 'IMPORTACION_MASIVA_XLSX', nombre: 'Entrada por importacion masiva (xlsx)' },
];
