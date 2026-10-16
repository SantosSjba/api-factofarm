import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Valida que `archivoId` sea un archivo de imagen subido por el mismo tenant. Las entidades
 * con imagen (`imagenArchivoId` único) deben además comprobar que no esté asignada a otro
 * registro antes de escribir.
 */
export async function assertTenantImageFile(
  prisma: PrismaService,
  archivoId: string,
  tenantId: string,
): Promise<void> {
  const archivo = await prisma.archivo.findUnique({
    where: { id: archivoId },
    select: { tenantId: true, mimeType: true },
  });
  if (!archivo || (archivo.tenantId && archivo.tenantId !== tenantId)) {
    throw new BadRequestException(
      'La imagen no existe o no pertenece a su empresa. Vuelva a subirla.',
    );
  }
  if (!archivo.mimeType.startsWith('image/')) {
    throw new BadRequestException(
      'El archivo seleccionado no es una imagen (use JPG, PNG o WEBP).',
    );
  }
}
