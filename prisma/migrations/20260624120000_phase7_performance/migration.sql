-- Índices compuestos para reportes y listados de alto volumen (Fase 7)
CREATE INDEX IF NOT EXISTS "Sale_establishmentId_estado_createdAt_idx" ON "Sale"("establishmentId", "estado", "createdAt");
CREATE INDEX IF NOT EXISTS "Sale_establishmentId_sellerId_createdAt_idx" ON "Sale"("establishmentId", "sellerId", "createdAt");
CREATE INDEX IF NOT EXISTS "ElectronicDocument_establishmentId_sunatStatus_idx" ON "ElectronicDocument"("establishmentId", "sunatStatus");
CREATE INDEX IF NOT EXISTS "ProductWarehouseStock_warehouseId_cantidad_idx" ON "ProductWarehouseStock"("warehouseId", "cantidad");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_action_createdAt_idx" ON "AuditLog"("entity", "action", "createdAt");
