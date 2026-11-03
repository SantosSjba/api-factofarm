-- Autorizador de controlados configurable por establecimiento
ALTER TABLE "Establishment" ADD COLUMN "posRequireControlledApproval" BOOLEAN NOT NULL DEFAULT true;
