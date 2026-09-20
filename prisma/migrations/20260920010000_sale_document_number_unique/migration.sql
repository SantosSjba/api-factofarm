-- Enforce unique document numbers per establishment (race-safe with advisory lock + unique)
CREATE UNIQUE INDEX "Sale_establishmentId_documentType_serie_numero_key"
ON "Sale"("establishmentId", "documentType", "serie", "numero");
