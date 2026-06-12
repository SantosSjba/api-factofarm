-- AlterTable
ALTER TABLE "ElectronicDocument" ADD COLUMN "saleReturnId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicDocument_saleReturnId_key" ON "ElectronicDocument"("saleReturnId");

-- AddForeignKey
ALTER TABLE "ElectronicDocument" ADD CONSTRAINT "ElectronicDocument_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
