import { BadRequestException } from '@nestjs/common';
import { WarehouseZoneType } from '../../generated/prisma/client';

export const REFRIGERATED_ZONE_QUARANTINE_MESSAGE =
  'Producto refrigerado bloqueado: la zona de frío del almacén está inactiva o no existe (cuarentena).';

type PrismaLike = {
  product: {
    count: (args: {
      where: { id: { in: string[] }; deletedAt: null; esRefrigerado: true };
    }) => Promise<number>;
  };
  warehouseZone: {
    findFirst: (args: {
      where: {
        warehouseId: string;
        deletedAt: null;
        activo: true;
        tipo: WarehouseZoneType;
      };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
};

export async function assertActiveColdZoneForRefrigeratedProducts(
  prisma: PrismaLike,
  warehouseId: string,
  productIds: string[],
): Promise<void> {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (!unique.length) return;

  const refrigerated = await prisma.product.count({
    where: { id: { in: unique }, deletedAt: null, esRefrigerado: true },
  });
  if (!refrigerated) return;

  const zone = await prisma.warehouseZone.findFirst({
    where: {
      warehouseId,
      deletedAt: null,
      activo: true,
      tipo: WarehouseZoneType.REFRIGERADO,
    },
    select: { id: true },
  });
  if (!zone) {
    throw new BadRequestException(REFRIGERATED_ZONE_QUARANTINE_MESSAGE);
  }
}
