import { BadRequestException } from '@nestjs/common';
import {
  CustomerDocumentType,
  PaymentMethod,
  Prisma,
  SaleDocumentType,
} from '../../../generated/prisma/client';

/** SUNAT: una boleta que supera este importe debe identificar al adquirente (DNI, CE, etc.). */
export const BOLETA_IDENTIFICATION_THRESHOLD = new Prisma.Decimal(700);

export type SaleCustomerRuleInput = {
  documentType: SaleDocumentType;
  total: Prisma.Decimal;
  payments: {
    metodo: PaymentMethod;
    monto: number | string | Prisma.Decimal;
  }[];
  customer: {
    nombre: string;
    tipoDocumento: CustomerDocumentType;
    numeroDocumento: string;
    limiteCredito: Prisma.Decimal | null;
  } | null;
  /** Saldo pendiente de las cuentas por cobrar abiertas del cliente. */
  openCreditBalance: Prisma.Decimal;
};

/** Suma de las líneas de pago a crédito. */
export function creditAmount(
  payments: SaleCustomerRuleInput['payments'],
): Prisma.Decimal {
  return payments
    .filter((p) => p.metodo === PaymentMethod.CREDITO)
    .reduce(
      (acc, p) => acc.plus(new Prisma.Decimal(p.monto)),
      new Prisma.Decimal(0),
    );
}

/**
 * Reglas del adquirente antes de mover stock: factura con RUC, boleta mayor a S/ 700
 * identificada y venta a crédito con cliente y dentro de su límite.
 */
export function assertSaleCustomerRules(input: SaleCustomerRuleInput): void {
  const { customer } = input;
  const identified =
    !!customer && customer.tipoDocumento !== CustomerDocumentType.DOC_SIN_RUC;

  if (input.documentType === SaleDocumentType.FACTURA) {
    if (!customer || customer.tipoDocumento !== CustomerDocumentType.RUC) {
      throw new BadRequestException(
        'La factura requiere un cliente con RUC. Seleccione o registre el cliente, o emita boleta.',
      );
    }
  }

  if (
    input.documentType === SaleDocumentType.BOLETA &&
    input.total.greaterThan(BOLETA_IDENTIFICATION_THRESHOLD) &&
    !identified
  ) {
    throw new BadRequestException(
      `Las boletas mayores a S/ ${BOLETA_IDENTIFICATION_THRESHOLD.toFixed(2)} deben identificar al cliente (DNI, CE o pasaporte). Seleccione el cliente.`,
    );
  }

  const credit = creditAmount(input.payments);
  if (credit.greaterThan(0)) {
    if (!identified) {
      throw new BadRequestException(
        'La venta a crédito requiere un cliente identificado para registrar la cuenta por cobrar.',
      );
    }
    const limit = customer.limiteCredito;
    if (limit && limit.greaterThan(0)) {
      const available = limit.minus(input.openCreditBalance);
      if (credit.greaterThan(available)) {
        throw new BadRequestException(
          `El crédito de ${customer.nombre} supera su límite: disponible S/ ${Prisma.Decimal.max(available, 0).toFixed(2)}, solicitado S/ ${credit.toFixed(2)}.`,
        );
      }
    }
  }
}
