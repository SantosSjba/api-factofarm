-- CreateEnum
CREATE TYPE "DrugInteractionSeverity" AS ENUM ('LEVE', 'MODERADA', 'GRAVE');

-- CreateTable
CREATE TABLE "DrugInteraction" (
    "id" TEXT NOT NULL,
    "principioA" VARCHAR(200) NOT NULL,
    "principioB" VARCHAR(200) NOT NULL,
    "severidad" "DrugInteractionSeverity" NOT NULL DEFAULT 'MODERADA',
    "descripcion" VARCHAR(500) NOT NULL,
    "recomendacion" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DrugInteraction_principioA_principioB_key" ON "DrugInteraction"("principioA", "principioB");
CREATE INDEX "DrugInteraction_deletedAt_idx" ON "DrugInteraction"("deletedAt");
CREATE INDEX "DrugInteraction_principioA_idx" ON "DrugInteraction"("principioA");
CREATE INDEX "DrugInteraction_principioB_idx" ON "DrugInteraction"("principioB");
