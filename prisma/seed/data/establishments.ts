import type { SeedEstablishmentInput } from '../types';

const baseSeries = [
  { documentType: 'FACTURA_ELECTRONICA', numero: 'F001' },
  { documentType: 'BOLETA_VENTA_ELECTRONICA', numero: 'B001' },
  { documentType: 'NOTA_CREDITO', numero: 'FC01' },
  { documentType: 'NOTA_CREDITO', numero: 'BC01' },
  { documentType: 'NOTA_DEBITO', numero: 'FD01' },
  { documentType: 'NOTA_DEBITO', numero: 'BD01' },
  { documentType: 'COMPROBANTE_RETENCION_ELECTRONICA', numero: 'R001' },
  { documentType: 'GUIA_REMISION_REMITENTE', numero: 'T001' },
  { documentType: 'COMPROBANTE_PERCEPCION_ELECTRONICA', numero: 'P001' },
  { documentType: 'NOTA_VENTA', numero: 'NV01' },
  { documentType: 'LIQUIDACION_COMPRA', numero: 'L001' },
  { documentType: 'GUIA_INGRESO_ALMACEN', numero: 'NIA1' },
  { documentType: 'GUIA_SALIDA_ALMACEN', numero: 'NSA1' },
  { documentType: 'GUIA_TRANSFERENCIA_ALMACEN', numero: 'NTA1' },
] as const;

export const establishmentsData: SeedEstablishmentInput[] = [
  {
    nombre: 'Oficina Principal',
    codigo: '0000',
    activo: true,
    pais: 'PERU',
    direccionFiscal: 'Empresa - Lima',
    correoContacto: 'empresa@factofarm.local',
    series: [...baseSeries],
  },
  {
    nombre: 'Sucursal',
    codigo: '0001',
    activo: true,
    pais: 'PERU',
    series: [...baseSeries],
  },
];
