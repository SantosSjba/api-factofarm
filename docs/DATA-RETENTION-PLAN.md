# Plan de retención y crecimiento de datos · FactoFarm

Documento operativo para evitar que el volumen multi-tenant (ventas, kardex, auditoría, SUNAT) degrade la plataforma a medida que crecen los clientes.

**Contexto:** una sola PostgreSQL compartida; aislamiento lógico por `tenantId` / `establishmentId`.  
**Principio:** primero **observabilidad + índices**; luego **purga solo de lo seguro**; **nunca borrar** ventas/comprobantes/kardex sin archivado y marco legal.

---

## Tablas de alto crecimiento

| Tabla | Crecimiento | ¿Se puede purgar? | Notas |
|-------|-------------|-------------------|--------|
| `Sale`, `SaleItem`, `SaleItemLot`, `Payment` | Muy alto | **No delete** | Cold storage Fase 3 (`ArchivedSale` + `archivedAt`) |
| `ElectronicDocument` (+ eventos) | Alto | **No** | SUNAT / inmutabilidad fiscal |
| `InventoryInboundMovement` (kardex) | Muy alto | **No delete** | Cold storage Fase 3 |
| `AuditLog` | Alto | **Sí** (con retención) | Purga Fase 2 |
| `AuthSession`, tokens reset | Medio | Sí (corto) | Ya caducan por diseño |
| Catálogos (`Product`, `Customer`) | Bajo–medio | Soft-delete | No purgar automáticamente |

---

## Horizontes legales / de negocio (guía)

| Dominio | Retención sugerida | Acción |
|---------|-------------------|--------|
| Auditoría operativa (`AuditLog`) | **24 meses** (configurable) | Purga automática por lotes |
| Ventas y comprobantes | **≥ 5 años** en hot+cold | Copiar a archive; no DELETE |
| Kardex / lotes | **≥ 5 años** | Copiar a archive; no DELETE |
| Datos personales (LPDP) | Según finalidad + derechos ARCO | Flujo compliance existente |

> Ajustar plazos con asesoría legal/contable antes de activar purgas/archivo en producción.

---

## Fases

### Fase 1 — Fundación ✅
- Índices compuestos tenant/fecha
- Env de retención
- `GET /platform/data-retention/metrics`
- Tabla `DataRetentionRun`

### Fase 2 — Purga segura de auditoría ✅
- Cron diario AuditLog
- Dry-run / purge con flag
- `POST .../audit/dry-run` y `.../audit/purge`

### Fase 3 — Cold storage ventas / kardex ✅
**Objetivo:** sacar histórico del hot path **sin perder datos**.

- Columnas `Sale.archivedAt` y `InventoryInboundMovement.archivedAt`
- Tablas `ArchivedSale` y `ArchivedInventoryInboundMovement` (payload JSON)
- Job semanal: copia + marca `archivedAt` (**nunca DELETE**)
- Listados hot (`sales.findAll`, kardex) excluyen `archivedAt != null` por defecto

**Jobs (SUPER_ADMIN):**
- `POST /api/v1/platform/data-retention/archive/sales/dry-run`
- `POST /api/v1/platform/data-retention/archive/sales`
- `POST /api/v1/platform/data-retention/archive/kardex/dry-run`
- `POST /api/v1/platform/data-retention/archive/kardex`

**Lectura tenant:**
- `GET /api/v1/sales?storage=hot|archived|all` — detalle `GET /sales/:id` resuelve hot o cold
- `GET /api/v1/inventory-movements/kardex?storage=hot|archived|all&productId=...`

**Lectura / restore plataforma:**
- `GET /api/v1/platform/data-retention/archive/sales`
- `GET /api/v1/platform/data-retention/archive/sales/:id`
- `POST /api/v1/platform/data-retention/archive/sales/:id/restore`
- `GET /api/v1/platform/data-retention/archive/kardex`
- `GET /api/v1/platform/data-retention/archive/kardex/:id`
- `POST /api/v1/platform/data-retention/archive/kardex/:id/restore`

> Restore solo limpia `archivedAt` en la fila hot; la copia cold permanece (re-archivo es idempotente por upsert).
### Fase 4 — Particionado PostgreSQL (preparado, no aplicado) 🟡
- Script de referencia: `prisma/scripts/phase4-partitioning-prep.sql`
- **No** se aplica automáticamente: requiere ventana de mantenimiento y DBA
- Usar cuando hot path siga grande tras Fase 3 (~10–20M filas)

### Fase 5 — Multi-DB / tenants grandes (documentado) 📋
Criterios sugeridos para valorar BD dedicada o shard:

| Señal | Umbral orientativo |
|-------|--------------------|
| Ventas hot / mes de un tenant | > 500k |
| Disco atribuible a un tenant | > 30% del total |
| Latencia p95 listados | Degradación sostenida vs resto |
| Cadena con muchas sedes | Plan CADENA al límite + crecimiento |

Estrategia futura (no implementada):

1. `DATABASE_URL` global + mapa opcional `TENANT_DB_URL_<slug>`
2. Router Prisma por `tenantId` (complejidad alta; no mezclar FKs cross-DB)
3. Empezar por **1–2 tenants grandes** como “dedicated”, no sharding total

Hasta entonces: Fase 3 + índices + pool (`PG_POOL_MAX`) bastan para escala inicial.

---

## Configuración (env)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATA_RETENTION_AUDIT_DAYS` | `730` | Días a conservar `AuditLog` |
| `DATA_RETENTION_PURGE_ENABLED` | `false` | Permite borrado real de AuditLog |
| `DATA_RETENTION_CRON` | `0 3 * * *` | Cron diario auditoría |
| `DATA_RETENTION_BATCH_SIZE` | `5000` | Lote delete/archive |
| `DATA_RETENTION_ARCHIVE_DAYS` | `1825` | Días en hot path (≈5 años) |
| `DATA_RETENTION_ARCHIVE_ENABLED` | `false` | Permite copiar a cold storage |
| `DATA_RETENTION_ARCHIVE_CRON` | `0 4 * * 0` | Cron semanal archive |

Ejemplo local (seguro: solo dry-run):

```env
DATA_RETENTION_AUDIT_DAYS=730
DATA_RETENTION_PURGE_ENABLED=false
DATA_RETENTION_ARCHIVE_DAYS=1825
DATA_RETENTION_ARCHIVE_ENABLED=false
```

Para probar archivado en local con pocos datos, puedes bajar temporalmente:

```env
DATA_RETENTION_ARCHIVE_DAYS=1
DATA_RETENTION_ARCHIVE_ENABLED=true
```

---

## Operación recomendada

1. `GET /platform/data-retention/metrics` semanalmente.
2. Dry-run auditoría y archive antes de habilitar flags.
3. Backup Postgres reciente.
4. Activar `*_ENABLED=true` solo tras validar conteos.
5. Monitorear `DataRetentionRun` y disco.

---

## Qué NO hacer

- `DELETE` de `Sale`, pagos o comprobantes SUNAT.
- Truncar kardex / lotes.
- Aplicar particionado (Fase 4) en caliente sin mantenimiento.
- Dejar flags de purge/archive en `true` sin backup.

---

## Referencias de código

| Pieza | Ruta |
|-------|------|
| Plan | `docs/DATA-RETENTION-PLAN.md` |
| Módulo Nest | `src/modules/data-retention/` |
| Migración Fase 1 | `prisma/migrations/20260723120000_data_retention_phase1/` |
| Migración Fase 3 | `prisma/migrations/20260723130000_data_retention_phase3_archive/` |
| Script Fase 4 | `prisma/scripts/phase4-partitioning-prep.sql` |
| Modelos | `prisma/models/data-retention.prisma` |

---

## Estado de implementación

| Fase | Estado |
|------|--------|
| 1 · Fundación | **Hecha** |
| 2 · Purga AuditLog | **Hecha** |
| 3 · Cold storage ventas/kardex | **Hecha** (API + UI consulta histórica) |
| 4 · Particionado | **Script preparado** (no auto-apply) |
| 5 · Multi-DB | **Documentado** (sin código de router aún) |
