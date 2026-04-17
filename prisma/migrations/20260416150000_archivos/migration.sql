-- CreateTable
CREATE TABLE "archivos" (
    "id" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "rutaRelativa" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "archivos_uploadedByUserId_idx" ON "archivos"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "fotoArchivoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_fotoArchivoId_key" ON "user_profiles"("fotoArchivoId");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_fotoArchivoId_fkey" FOREIGN KEY ("fotoArchivoId") REFERENCES "archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
