-- Relations that require users/user_profiles (created in init_users_phase1).

-- AddForeignKey
ALTER TABLE "archivos"
ADD CONSTRAINT "archivos_uploadedByUserId_fkey"
FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "fotoArchivoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_fotoArchivoId_key"
ON "user_profiles"("fotoArchivoId");

-- AddForeignKey
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_fotoArchivoId_fkey"
FOREIGN KEY ("fotoArchivoId") REFERENCES "archivos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
