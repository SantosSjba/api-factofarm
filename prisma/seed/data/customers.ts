import type { SeedCustomerInput, SeedCustomerZoneInput } from '../types';

export const customerZonesData: SeedCustomerZoneInput[] = [
  { nombre: 'LIMA' },
  { nombre: 'AREQUIPA' },
];

export const customersData: SeedCustomerInput[] = [
  {
    nombre: 'CLIENTES - VARIOS',
    tipoDocumento: 'DOC_SIN_RUC',
    numeroDocumento: '99999999',
    diasCredito: 0,
    puntosAcumulados: 517,
    customerTypeDescripcion: 'INTERNO',
    zoneNombre: 'LIMA',
    addresses: [{ esPrincipal: true, pais: 'PERU' }],
  },
  {
    nombre: 'BUSTAMANTE BARANDIARAN HILDA ROSA',
    tipoDocumento: 'RUC',
    numeroDocumento: '10174051432',
    diasCredito: 0,
    puntosAcumulados: 67,
    customerTypeDescripcion: 'DISTRIBUIDOR',
    zoneNombre: 'LIMA',
    addresses: [{ esPrincipal: true, pais: 'PERU' }],
  },
];
