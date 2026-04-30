import type { SeedCompoundProductInput } from '../types';

export const compoundProductPlatformsData = [
  { nombre: 'NINGUNO' },
  { nombre: 'WEB' },
  { nombre: 'MOBILE' },
  { nombre: 'PUNTO DE VENTA' },
];

export const compoundProductsData: SeedCompoundProductInput[] = [
  {
    codigoInterno: 'CP-0001',
    nombre: 'PACK RESPIRATORIO',
    nombreSecundario: 'Promoción Invierno',
    descripcion: 'Pack con productos para soporte respiratorio',
    modelo: 'PACK-STD',
    precioUnitarioVenta: '10.00',
    precioUnitarioCompra: '6.50',
    codigoSunat: '20111111',
    plataformaNombre: 'PUNTO DE VENTA',
    categoryNombre: 'PROD. SANITARIO',
    brandNombre: 'LYAFARM',
    items: [
      { productCodigoInterno: '0002', cantidad: '1', precioUnitario: '3.00' },
      { productCodigoInterno: '0004', cantidad: '1', precioUnitario: '3.00' },
    ],
  },
];
