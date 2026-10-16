import {
  CustomerDocumentType,
  PaymentMethod,
  Prisma,
  SaleDocumentType,
} from '../../../generated/prisma/client';
import { assertSaleCustomerRules } from './sale-customer-rules.util';

const D = (v: number) => new Prisma.Decimal(v);
const cliente = (
  tipoDocumento: CustomerDocumentType,
  limiteCredito: number | null = null,
) => ({
  nombre: 'QA',
  tipoDocumento,
  numeroDocumento: '12345678',
  limiteCredito: limiteCredito === null ? null : D(limiteCredito),
});
const base = {
  total: D(100),
  payments: [{ metodo: PaymentMethod.EFECTIVO, monto: 100 }],
  openCreditBalance: D(0),
};

describe('assertSaleCustomerRules', () => {
  it('exige cliente con RUC para factura', () => {
    expect(() =>
      assertSaleCustomerRules({
        ...base,
        documentType: SaleDocumentType.FACTURA,
        customer: cliente(CustomerDocumentType.DNI),
      }),
    ).toThrow(/factura requiere un cliente con RUC/);
    expect(() =>
      assertSaleCustomerRules({
        ...base,
        documentType: SaleDocumentType.FACTURA,
        customer: cliente(CustomerDocumentType.RUC),
      }),
    ).not.toThrow();
  });

  it('exige identificar al cliente en boletas mayores a S/ 700', () => {
    const boleta = {
      ...base,
      total: D(700.01),
      documentType: SaleDocumentType.BOLETA,
    };
    expect(() =>
      assertSaleCustomerRules({ ...boleta, customer: null }),
    ).toThrow(/mayores a S\/ 700/);
    expect(() =>
      assertSaleCustomerRules({
        ...boleta,
        customer: cliente(CustomerDocumentType.DOC_SIN_RUC),
      }),
    ).toThrow(/identificar al cliente/);
    expect(() =>
      assertSaleCustomerRules({ ...boleta, total: D(700), customer: null }),
    ).not.toThrow();
  });

  it('exige cliente y respeta el límite en ventas a crédito', () => {
    const credito = {
      ...base,
      documentType: SaleDocumentType.NOTA_VENTA,
      payments: [{ metodo: PaymentMethod.CREDITO, monto: 100 }],
    };
    expect(() =>
      assertSaleCustomerRules({ ...credito, customer: null }),
    ).toThrow(/crédito requiere un cliente/);
    expect(() =>
      assertSaleCustomerRules({
        ...credito,
        customer: cliente(CustomerDocumentType.DNI, 150),
        openCreditBalance: D(60),
      }),
    ).toThrow(/supera su límite/);
    expect(() =>
      assertSaleCustomerRules({
        ...credito,
        customer: cliente(CustomerDocumentType.DNI, 150),
        openCreditBalance: D(50),
      }),
    ).not.toThrow();
  });
});
