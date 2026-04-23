import { DEPARTMENTS, DISTRICTS, PROVINCES } from '../data';
import type { SeedDb } from '../types';

export async function seedUbigeo(prisma: SeedDb): Promise<void> {
  console.log('\n🗺️ Creating ubigeo (all Peru)...');
  const CHUNK = 500;

  async function bulkUpsertDepartments(rows: readonly { id: string; name: string }[]) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await prisma.$transaction(
        chunk.map(row =>
          prisma.department.upsert({
            where: { id: row.id },
            update: { name: row.name },
            create: { id: row.id, name: row.name },
          }),
        ),
      );
    }
  }

  async function bulkUpsertProvinces(
    rows: readonly { id: string; departmentId: string; name: string }[],
  ) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await prisma.$transaction(
        chunk.map(row =>
          prisma.province.upsert({
            where: { id: row.id },
            update: { departmentId: row.departmentId, name: row.name },
            create: { id: row.id, departmentId: row.departmentId, name: row.name },
          }),
        ),
      );
    }
  }

  async function bulkUpsertDistricts(
    rows: readonly { id: string; provinceId: string; name: string }[],
  ) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await prisma.$transaction(
        chunk.map(row =>
          prisma.district.upsert({
            where: { id: row.id },
            update: { provinceId: row.provinceId, name: row.name },
            create: { id: row.id, provinceId: row.provinceId, name: row.name },
          }),
        ),
      );
    }
  }

  await bulkUpsertDepartments(DEPARTMENTS);
  console.log(`   ✅ ${DEPARTMENTS.length} departments`);

  await bulkUpsertProvinces(PROVINCES);
  console.log(`   ✅ ${PROVINCES.length} provinces`);

  for (let i = 0; i < DISTRICTS.length; i += CHUNK) {
    await bulkUpsertDistricts(DISTRICTS.slice(i, i + CHUNK));
    console.log(`   ... districts ${i + 1}–${Math.min(i + CHUNK, DISTRICTS.length)} done`);
  }
  console.log(`   ✅ ${DISTRICTS.length} districts`);
}
