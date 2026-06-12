-- Laboratory
CREATE TABLE "Laboratory" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Laboratory_nombre_key" ON "Laboratory"("nombre");
CREATE INDEX "Laboratory_deletedAt_idx" ON "Laboratory"("deletedAt");

-- PharmaceuticalForm
CREATE TABLE "PharmaceuticalForm" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PharmaceuticalForm_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PharmaceuticalForm_nombre_key" ON "PharmaceuticalForm"("nombre");
CREATE INDEX "PharmaceuticalForm_deletedAt_idx" ON "PharmaceuticalForm"("deletedAt");

-- ActivePrinciple
CREATE TABLE "ActivePrinciple" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActivePrinciple_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ActivePrinciple_nombre_key" ON "ActivePrinciple"("nombre");
CREATE INDEX "ActivePrinciple_deletedAt_idx" ON "ActivePrinciple"("deletedAt");

-- Customer credit limit
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "limiteCredito" DECIMAL(18,4);
