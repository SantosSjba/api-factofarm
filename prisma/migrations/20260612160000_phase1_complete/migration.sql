-- AdministrationRoute catalog
CREATE TABLE "AdministrationRoute" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdministrationRoute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdministrationRoute_nombre_key" ON "AdministrationRoute"("nombre");
CREATE INDEX "AdministrationRoute_deletedAt_idx" ON "AdministrationRoute"("deletedAt");

-- Category hierarchy
ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Product extended pharma fields
ALTER TABLE "Product" ADD COLUMN "esControlado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "esRefrigerado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "esHospitalario" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "stockMaximo" INTEGER;
ALTER TABLE "Product" ADD COLUMN "administrationRouteId" TEXT;

CREATE INDEX "Product_administrationRouteId_idx" ON "Product"("administrationRouteId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_administrationRouteId_fkey" FOREIGN KEY ("administrationRouteId") REFERENCES "AdministrationRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Product bioequivalents
CREATE TABLE "ProductEquivalent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "equivalentProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEquivalent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductEquivalent_productId_equivalentProductId_key" ON "ProductEquivalent"("productId", "equivalentProductId");
CREATE INDEX "ProductEquivalent_equivalentProductId_idx" ON "ProductEquivalent"("equivalentProductId");

ALTER TABLE "ProductEquivalent" ADD CONSTRAINT "ProductEquivalent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductEquivalent" ADD CONSTRAINT "ProductEquivalent_equivalentProductId_fkey" FOREIGN KEY ("equivalentProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
