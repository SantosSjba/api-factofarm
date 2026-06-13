-- Multi-tenant platform: clientes SaaS, leads y aislamiento por tenant

CREATE TYPE "TenantPlan" AS ENUM ('BOTICA', 'FARMACIA_PRO', 'CADENA', 'CUSTOM');
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "TenantLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED');

CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" VARCHAR(11),
    "slug" VARCHAR(60) NOT NULL,
    "plan" "TenantPlan" NOT NULL DEFAULT 'BOTICA',
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "maxEstablishments" INTEGER NOT NULL DEFAULT 1,
    "maxUsers" INTEGER NOT NULL DEFAULT 3,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "nombre" TEXT NOT NULL,
    "farmacia" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mensaje" TEXT,
    "status" "TenantLeadStatus" NOT NULL DEFAULT 'NEW',
    "planInterest" "TenantPlan",
    "source" VARCHAR(40) NOT NULL DEFAULT 'landing',
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_ruc_key" ON "tenants"("ruc");
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");
CREATE INDEX "tenants_deletedAt_idx" ON "tenants"("deletedAt");
CREATE INDEX "tenant_leads_status_idx" ON "tenant_leads"("status");
CREATE INDEX "tenant_leads_email_idx" ON "tenant_leads"("email");

INSERT INTO "tenants" (
    "id", "nombre", "slug", "plan", "status", "maxEstablishments", "maxUsers",
    "contactEmail", "activatedAt", "updatedAt"
)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'FactoFarm Demo',
    'factofarm-demo',
    'CADENA',
    'ACTIVE',
    20,
    50,
    'empresa@factofarm.local',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

ALTER TABLE "Establishment" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;

UPDATE "Establishment" SET "tenantId" = '00000000-0000-4000-8000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "users" SET "tenantId" = '00000000-0000-4000-8000-000000000001'
WHERE "tenantId" IS NULL AND "role" <> 'SUPER_ADMIN';

ALTER TABLE "Establishment" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "Establishment_tenantId_idx" ON "Establishment"("tenantId");
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tenant_leads" ADD CONSTRAINT "tenant_leads_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
