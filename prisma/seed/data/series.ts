import type { SeedProductSerialInput } from '../types';

export const productSerialsSeed: SeedProductSerialInput[] = [
  {
    serie: 'SERB1001',
    productCodigoInterno: '0001',
    warehouseNombre: 'Almacén Oficina Principal',
    estado: 'DISPONIBLE',
    vendido: false,
  },
  {
    serie: 'SERB1002',
    productCodigoInterno: '0001',
    warehouseNombre: 'Almacén Oficina Principal',
    estado: 'ANULADO',
    vendido: false,
  },
  {
    serie: 'SERB1003',
    productCodigoInterno: '0002',
    warehouseNombre: 'Almacén - SUCURSAL',
    estado: 'VENDIDO',
    vendido: true,
  },
];
