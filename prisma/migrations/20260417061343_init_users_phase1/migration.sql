-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRADOR', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "IdentityDocumentType" AS ENUM ('DNI', 'CE', 'PASAPORTE', 'OTRO');

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "userId" TEXT NOT NULL,
    "tipoDocumento" "IdentityDocumentType",
    "numeroDocumento" TEXT,
    "nombres" TEXT,
    "apellidos" TEXT,
    "fechaNacimiento" DATE,
    "emailPersonal" TEXT,
    "direccion" TEXT,
    "celularPersonal" TEXT,
    "emailCorporativo" TEXT,
    "celularCorporativo" TEXT,
    "fechaContratacion" DATE,
    "cargo" TEXT,
    "fotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_codigo_key" ON "Establishment"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_establecimientoId_idx" ON "users"("establecimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
