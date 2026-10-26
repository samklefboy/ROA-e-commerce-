-- CreateEnum
CREATE TYPE "StoreReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "StoreReportReason" AS ENUM ('FRAUD_OR_SCAM', 'MISLEADING_LISTING', 'COUNTERFEIT_OR_PROHIBITED', 'SELLER_MISCONDUCT', 'REPEATED_CANCELLATIONS', 'DELIVERY_OR_FULFILMENT', 'POOR_PRODUCT_QUALITY', 'OTHER');

-- CreateTable
CREATE TABLE "StoreReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT,
    "reason" "StoreReportReason" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "StoreReportStatus" NOT NULL DEFAULT 'OPEN',
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreReport_reporterId_createdAt_idx" ON "StoreReport"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReport_storeId_status_createdAt_idx" ON "StoreReport"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReport_orderId_idx" ON "StoreReport"("orderId");

-- CreateIndex
CREATE INDEX "StoreReport_status_createdAt_idx" ON "StoreReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReport_reviewedById_idx" ON "StoreReport"("reviewedById");

-- AddForeignKey
ALTER TABLE "StoreReport" ADD CONSTRAINT "StoreReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReport" ADD CONSTRAINT "StoreReport_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReport" ADD CONSTRAINT "StoreReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReport" ADD CONSTRAINT "StoreReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
