import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { createValidationPipe, humanizeField } from './validation-pipe.factory';

class LineaDto {
  @IsInt()
  @Min(1)
  cantidad!: number;
}

class VentaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  nombreCliente!: string;

  @IsString({ message: 'Mensaje propio del DTO' })
  serie!: string;

  @ValidateNested({ each: true })
  @Type(() => LineaDto)
  lineas!: LineaDto[];
}

const pipe = createValidationPipe();

async function messageOf(value: unknown): Promise<{
  message: string;
  details: { field: string; messages: string[] }[];
}> {
  try {
    await pipe.transform(value, { type: 'body', metatype: VentaDto });
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    return (err as BadRequestException).getResponse() as never;
  }
  throw new Error('Se esperaba error de validación');
}

describe('createValidationPipe', () => {
  it('traduce mensajes por defecto y conserva los propios', async () => {
    const res = await messageOf({ lineas: [] });
    expect(res.message).toContain('«nombre cliente» es obligatorio');
    expect(res.message).toContain('Mensaje propio del DTO');
    expect(res.message).not.toMatch(/\b(must|should)\b/);
  });

  it('incluye límites numéricos y rutas anidadas', async () => {
    const res = await messageOf({
      nombreCliente: 'demasiado largo',
      serie: 'B001',
      lineas: [{ cantidad: 0 }],
    });
    expect(res.message).toContain('no puede superar 10 caracteres');
    expect(res.message).toContain(
      '«lineas › #1 › cantidad» no puede ser menor que 1',
    );
  });

  it('rechaza campos no permitidos en español', async () => {
    const res = await messageOf({
      nombreCliente: 'Ana',
      serie: 'B001',
      lineas: [],
      role: 'ADMIN',
    });
    expect(res.message).toBe(
      'El campo «role» no está permitido en esta operación.',
    );
  });

  it('humaniza nombres de campos', () => {
    expect(humanizeField('precioVenta')).toBe('precio venta');
    expect(humanizeField('items.0.lote_id')).toBe('items › #1 › lote id');
  });
});
