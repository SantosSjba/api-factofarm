-- =============================================================================
-- Fase 4 · Particionado PostgreSQL (PREPARACIÓN — NO aplicar a ciegas en prod)
-- =============================================================================
-- Objetivo: particionar tablas de alto volumen por rango de fechas.
-- Estado: script de referencia. Convertir una tabla existente a particionada
-- requiere ventana de mantenimiento, double-write o pg_partman.
--
-- Recomendación FactoFarm:
-- 1) Primero operar Fase 3 (cold storage con archivedAt).
-- 2) Cuando Sale hot > ~10–20M filas, planificar partición anual/mensual.
-- 3) Usar este script solo en laboratorio o con DBA.
-- =============================================================================

-- Ejemplo de plantilla para NUEVAS instalaciones (tabla vacía):
--
-- CREATE TABLE "Sale_partitioned" (
--   LIKE "Sale" INCLUDING DEFAULTS INCLUDING CONSTRAINTS
-- ) PARTITION BY RANGE ("createdAt");
--
-- CREATE TABLE "Sale_y2025" PARTITION OF "Sale_partitioned"
--   FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
-- CREATE TABLE "Sale_y2026" PARTITION OF "Sale_partitioned"
--   FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
-- CREATE TABLE "Sale_default" PARTITION OF "Sale_partitioned" DEFAULT;
--
-- Migración de datos (offline):
-- INSERT INTO "Sale_partitioned" SELECT * FROM "Sale";
-- -- luego rename + swap de FKs (complejo: SaleItem.saleId, etc.)
--
-- Alternativa más segura a corto plazo:
-- - Mantener Sale unificada
-- - Excluir archivedAt IS NOT NULL del hot path (Fase 3)
-- - Detach futuro: mover particiones anuales a tablespace frío

SELECT
  'phase4-partitioning-prep' AS script,
  NOW() AS generated_at,
  (
    SELECT COUNT(*) FROM "Sale" WHERE "archivedAt" IS NULL
  ) AS hot_sales,
  (
    SELECT COUNT(*) FROM "Sale" WHERE "archivedAt" IS NOT NULL
  ) AS archived_sales;
