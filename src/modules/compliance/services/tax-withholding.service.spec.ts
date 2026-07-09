import { TaxWithholdingService } from './tax-withholding.service';

describe('TaxWithholdingService.calculate', () => {
  const service = new TaxWithholdingService({} as never, {} as never, {} as never);

  it('calcula monto de retención/percepción', () => {
    const result = service.calculate(1000, 3);
    expect(result.baseImponible).toBe('1000');
    expect(result.tasa).toBe('3');
    expect(result.monto).toBe('30');
  });

  it('redondea a 4 decimales', () => {
    const result = service.calculate(100, 2.5);
    expect(result.monto).toBe('2.5');
  });
});
