-- Alinea Service con Product (DIGEMID): vigencia registro sanitario
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "registroSanitarioVigencia" TIMESTAMP(3);
