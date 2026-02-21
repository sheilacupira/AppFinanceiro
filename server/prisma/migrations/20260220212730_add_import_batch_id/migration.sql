-- AlterTable
ALTER TABLE "FinanceTransaction" ADD COLUMN "importBatchId" TEXT;

-- CreateIndex
CREATE INDEX "FinanceTransaction_tenantId_importBatchId_idx" ON "FinanceTransaction"("tenantId", "importBatchId");
