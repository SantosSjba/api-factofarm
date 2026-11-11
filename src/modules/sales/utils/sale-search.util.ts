import type { Prisma } from '../../../generated/prisma/client';
import { textSearchFilter } from '../../../common/utils/text-search-filter';

/**
 * «B001-25», «B001-00000025», «25» o «B001»: separa serie y número del comprobante.
 * El número se guarda con ceros a la izquierda, así que se compara sin ellos al final.
 */
export function parseDocumentNumber(
  search: string,
): { serie?: string; numero?: string } | null {
  const term = search.trim().toUpperCase();
  const full = /^([A-Z0-9]{4})\s*-\s*0*(\d+)$/.exec(term);
  if (full) return { serie: full[1], numero: full[2] };
  const onlyNumber = /^0*(\d+)$/.exec(term);
  if (onlyNumber) return { numero: onlyNumber[1] };
  const onlySerie = /^[A-Z]{1,2}[0-9A-Z]{2,3}$/.exec(term);
  if (onlySerie) return { serie: term };
  return null;
}

/** Condiciones OR para buscar una venta por comprobante o cliente. */
export function saleSearchFilter(search: string): Prisma.SaleWhereInput[] {
  const term = search.trim();
  const doc = parseDocumentNumber(term);
  const or: Prisma.SaleWhereInput[] = [
    { customer: { nombre: textSearchFilter(term) } },
    { customer: { numeroDocumento: { contains: term } } },
  ];
  if (doc) {
    or.push({
      ...(doc.serie ? { serie: doc.serie } : {}),
      ...(doc.numero ? { numero: { in: [doc.numero, doc.numero.padStart(8, '0')] } } : {}),
    });
  }
  return or;
}

/** Condiciones OR para buscar un comprobante electrónico por número o cliente. */
export function electronicDocumentSearchFilter(
  search: string,
): Prisma.ElectronicDocumentWhereInput[] {
  const term = search.trim();
  const doc = parseDocumentNumber(term);
  const or: Prisma.ElectronicDocumentWhereInput[] = [
    { customerNombre: textSearchFilter(term) },
    { customerDocNumber: { contains: term } },
  ];
  if (doc) {
    or.push({
      ...(doc.serie ? { serie: doc.serie } : {}),
      ...(doc.numero ? { numero: { in: [doc.numero, doc.numero.padStart(8, '0')] } } : {}),
    });
  }
  return or;
}
