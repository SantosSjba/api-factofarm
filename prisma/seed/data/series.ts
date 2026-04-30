import type { SeedProductSerialInput } from '../types';

export const productSerialsSeed: SeedProductSerialInput[] = [
  { serie: 'SR-000001', productCodigoInterno: 'P001', estado: 'DISPONIBLE', vendido: false },
  { serie: 'SR-000002', productCodigoInterno: 'P002', estado: 'RESERVADO', vendido: false },
  { serie: 'SR-000003', productCodigoInterno: 'P003', estado: 'VENDIDO', vendido: true },
];
