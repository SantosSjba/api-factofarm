import type { SeedProductLotInput } from '../types';

export const productLotStocksSeed: SeedProductLotInput[] = [
  {
    productCodigoInterno: '0001',
    warehouseNombre: 'Almacén Oficina Principal',
    codigoLote: 'LOTZBC001',
    stock: '40',
    fechaVencimiento: '2027-10-12',
  },
  {
    productCodigoInterno: '0001',
    warehouseNombre: 'Almacén Oficina Principal',
    codigoLote: 'LOTZBC002',
    stock: '60',
    fechaVencimiento: '2027-10-13',
  },
  {
    productCodigoInterno: '0003',
    warehouseNombre: 'Almacén - SUCURSAL',
    codigoLote: 'LOTZBC003',
    stock: '90',
    fechaVencimiento: '2027-11-12',
  },
];
