-- Fase 9: números Yape/Plin informativos por establecimiento (POS)

ALTER TABLE "Establishment"
  ADD COLUMN IF NOT EXISTS "posYapeNumero" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "posPlinNumero" VARCHAR(20);
