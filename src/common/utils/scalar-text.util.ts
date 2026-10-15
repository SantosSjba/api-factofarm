import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

/** Convert supported scalar values without silently accepting arbitrary objects. */
export function scalarText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  )
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Prisma.Decimal) return value.toString();
  throw new BadRequestException('Se esperaba un valor de texto o número');
}
