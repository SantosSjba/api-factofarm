/** Tipos compartidos entre data/ y steps/ del seed (sin depender de Prisma en datos puros). */
import type { PrismaClient } from '../../src/generated/prisma/client';

export type SeedDocumentSeriesType =
  | 'FACTURA_ELECTRONICA'
  | 'BOLETA_VENTA_ELECTRONICA'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'GUIA_REMISION_REMITENTE'
  | 'COMPROBANTE_RETENCION_ELECTRONICA'
  | 'GUIA_REMISION_TRANSPORTISTA'
  | 'COMPROBANTE_PERCEPCION_ELECTRONICA'
  | 'NOTA_VENTA'
  | 'LIQUIDACION_COMPRA'
  | 'GUIA_INGRESO_ALMACEN'
  | 'GUIA_SALIDA_ALMACEN'
  | 'GUIA_TRANSFERENCIA_ALMACEN';

export type SeedEstablishmentSeriesInput = {
  documentType: SeedDocumentSeriesType;
  numero: string;
  esContingencia?: boolean;
};

export type SeedEstablishmentInput = {
  nombre: string;
  codigo: string;
  activo: boolean;
  pais?: string;
  direccionFiscal?: string;
  correoContacto?: string;
  series?: SeedEstablishmentSeriesInput[];
};

export type SeedDb = PrismaClient;

export type SeedCustomerTypeInput = {
  descripcion: string;
};
