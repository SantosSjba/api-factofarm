import type { CustomerDocumentType, PrismaClient } from '../../../src/generated/prisma/client';
import { customersData, customerZonesData } from '../data/customers';

export async function seedCustomers(prisma: PrismaClient): Promise<void> {
  for (const zone of customerZonesData) {
    const nombre = zone.nombre.trim().toUpperCase();
    if (!nombre) continue;
    await prisma.customerZone.upsert({
      where: { nombre },
      update: { nombre, deletedAt: null },
      create: { nombre },
    });
  }

  for (const row of customersData) {
    const nombre = row.nombre.trim().toUpperCase();
    const numeroDocumento = row.numeroDocumento.trim();
    if (!nombre || !numeroDocumento) continue;

    const customerType = row.customerTypeDescripcion
      ? await prisma.customerType.findFirst({
          where: {
            descripcion: row.customerTypeDescripcion.trim().toUpperCase(),
            deletedAt: null,
          },
          select: { id: true },
        })
      : null;

    const zone = row.zoneNombre
      ? await prisma.customerZone.findFirst({
          where: { nombre: row.zoneNombre.trim().toUpperCase(), deletedAt: null },
          select: { id: true },
        })
      : null;

    const customer = await prisma.customer.upsert({
      where: {
        tipoDocumento_numeroDocumento: {
          tipoDocumento: row.tipoDocumento as CustomerDocumentType,
          numeroDocumento,
        },
      },
      update: {
        nombre,
        nombreComercial: row.nombreComercial?.trim() || null,
        nacionalidad: row.nacionalidad?.trim().toUpperCase() || 'PERU',
        diasCredito: row.diasCredito ?? 0,
        codigoInterno: row.codigoInterno?.trim() || null,
        observaciones: row.observaciones?.trim() || null,
        puntosAcumulados: row.puntosAcumulados ?? 0,
        customerTypeId: customerType?.id ?? null,
        zoneId: zone?.id ?? null,
        deletedAt: null,
      },
      create: {
        nombre,
        tipoDocumento: row.tipoDocumento as CustomerDocumentType,
        numeroDocumento,
        nombreComercial: row.nombreComercial?.trim() || null,
        nacionalidad: row.nacionalidad?.trim().toUpperCase() || 'PERU',
        diasCredito: row.diasCredito ?? 0,
        codigoInterno: row.codigoInterno?.trim() || null,
        observaciones: row.observaciones?.trim() || null,
        puntosAcumulados: row.puntosAcumulados ?? 0,
        customerTypeId: customerType?.id ?? null,
        zoneId: zone?.id ?? null,
      },
      select: { id: true },
    });

    if (row.addresses?.length) {
      await prisma.customerAddress.deleteMany({ where: { customerId: customer.id } });
      await prisma.customerAddress.createMany({
        data: row.addresses.map((a) => ({
          customerId: customer.id,
          esPrincipal: a.esPrincipal ?? false,
          pais: a.pais?.trim().toUpperCase() || 'PERU',
          direccion: a.direccion?.trim() || null,
          telefono: a.telefono?.trim() || null,
          correoElectronico: a.correoElectronico?.trim().toLowerCase() || null,
          correosOpcionales: a.correosOpcionales?.trim() || null,
          departmentId: a.departmentId?.trim() || null,
          provinceId: a.provinceId?.trim() || null,
          districtId: a.districtId?.trim() || null,
        })),
      });
    }
  }
}
