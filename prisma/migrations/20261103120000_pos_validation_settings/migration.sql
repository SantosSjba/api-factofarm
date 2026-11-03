-- Validaciones de POS configurables por establecimiento
ALTER TABLE "Establishment" ADD COLUMN "posRequirePrescription" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Establishment" ADD COLUMN "posPaymentReferenceMethods" "PaymentMethod"[] DEFAULT ARRAY['YAPE', 'PLIN', 'TARJETA', 'TRANSFERENCIA']::"PaymentMethod"[];
