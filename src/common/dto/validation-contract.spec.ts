import { ExchangePanelHandoffDto } from '../../modules/auth/application/dto/exchange-panel-handoff.dto';
import { ValidationPipe } from '@nestjs/common';
import { ProductListQueryDto } from '../../modules/products/dto/product-list-query.dto';
import { PromotionListQueryDto } from '../../modules/marketing/dto/marketing.dto';
import { BankMovementListQueryDto } from '../../modules/finance/dto/finance.dto';
import { UpdateMeDto } from '../../modules/auth/application/dto/update-me.dto';
import {
  RequiredPeriodQueryDto,
  RequiredLotQueryDto,
} from './required-report-query.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: false },
});
const validate = (
  metatype: any,
  value: unknown,
  type: 'query' | 'body' = 'query',
) => pipe.transform(value, { type, metatype });
describe('Contrato real de validación HTTP', () => {
  it.each([
    [ProductListQueryDto, 'habilitado'],
    [PromotionListQueryDto, 'activo'],
    [BankMovementListQueryDto, 'conciliado'],
  ])(
    'filtros %p aceptan false y rechazan texto arbitrario',
    async (dto, field) => {
      expect(
        (await validate(dto, { [field as string]: 'false' }))[field as string],
      ).toBe(false);
      expect(
        (await validate(dto, { [field as string]: 'true' }))[field as string],
      ).toBe(true);
      await expect(
        validate(dto, { [field as string]: 'invalid' }),
      ).rejects.toThrow();
    },
  );
  it('recorta el nombre antes de validar y no convierte números en texto', async () => {
    await expect(
      validate(UpdateMeDto, { nombre: '  ' }, 'body'),
    ).rejects.toThrow();
    await expect(
      validate(UpdateMeDto, { nombre: null }, 'body'),
    ).rejects.toThrow();
    await expect(
      validate(UpdateMeDto, { email: null }, 'body'),
    ).rejects.toThrow();
    await expect(
      validate(UpdateMeDto, { nombre: 123 }, 'body'),
    ).rejects.toThrow();
    expect(
      (
        await validate(
          UpdateMeDto,
          { nombre: ' Ana ', email: ' ANA@EXAMPLE.COM ' },
          'body',
        )
      ).email,
    ).toBe('ana@example.com');
  });
  it.each([undefined, '', '2026-13', '2026-00', 'foo'])(
    'rechaza periodo inválido %p',
    async (period) => {
      await expect(
        validate(RequiredPeriodQueryDto, { period }),
      ).rejects.toThrow();
    },
  );
  it('rechaza lote vacío y claves desconocidas', async () => {
    await expect(
      validate(RequiredLotQueryDto, { codigoLote: '  ' }),
    ).rejects.toThrow();
    await expect(
      validate(UpdateMeDto, { role: 'SUPER_ADMIN' }, 'body'),
    ).rejects.toThrow();
  });
  it('el código de soporte exige un token hexadecimal de longitud exacta', async () => {
    await expect(validate(ExchangePanelHandoffDto, { code: 123 }, 'body')).rejects.toThrow();
    await expect(validate(ExchangePanelHandoffDto, { code: 'bad' }, 'body')).rejects.toThrow();
    expect((await validate(ExchangePanelHandoffDto, { code: 'a'.repeat(64) }, 'body')).code).toBe('a'.repeat(64));
  });

});
