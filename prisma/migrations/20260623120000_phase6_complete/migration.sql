-- Sale: doble validación controlados
ALTER TABLE "Sale" ADD COLUMN "controlledApprovedById" TEXT;
ALTER TABLE "Sale" ADD COLUMN "controlledApprovedAt" TIMESTAMP(3);
CREATE INDEX "Sale_controlledApprovedById_idx" ON "Sale"("controlledApprovedById");
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_controlledApprovedById_fkey" FOREIGN KEY ("controlledApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AdverseEvent: notificación DIGEMID ampliada
ALTER TABLE "AdverseEvent" ADD COLUMN "digemidReportNumber" VARCHAR(40);
ALTER TABLE "AdverseEvent" ADD COLUMN "medidasCorrectivas" VARCHAR(2000);
ALTER TABLE "AdverseEvent" ADD COLUMN "fechaNotificacion" TIMESTAMP(3);
ALTER TABLE "AdverseEvent" ADD COLUMN "pacienteEdad" INTEGER;
ALTER TABLE "AdverseEvent" ADD COLUMN "pacienteSexo" VARCHAR(10);
ALTER TABLE "AdverseEvent" ADD COLUMN "reaccionTipo" VARCHAR(120);
ALTER TABLE "AdverseEvent" ADD COLUMN "cie10Codigo" VARCHAR(10);

-- Prescription: imagen escaneada
CREATE UNIQUE INDEX "Prescription_imagenArchivoId_key" ON "Prescription"("imagenArchivoId");
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_imagenArchivoId_fkey" FOREIGN KEY ("imagenArchivoId") REFERENCES "archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
