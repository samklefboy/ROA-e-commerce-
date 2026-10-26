-- CreateEnum
CREATE TYPE "DisputeItemOutcome" AS ENUM ('REJECTED', 'MINOR_DEFECT', 'MODERATE_DEFECT', 'MAJOR_DEFECT_OR_MISMATCH', 'UNUSABLE_OR_FUNDAMENTALLY_DIFFERENT', 'MISSING_ITEM');

-- CreateEnum
CREATE TYPE "DisputeResolutionOutcome" AS ENUM ('REJECTED', 'PRODUCT_COMPENSATION', 'SELLER_RESPONSIBLE_NON_DELIVERY');

-- AlterEnum
ALTER TYPE "DisputeReason" ADD VALUE 'NON_DELIVERY';

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "deliveryFeeRefundEligible" BOOLEAN,
ADD COLUMN     "resolutionOutcome" "DisputeResolutionOutcome";

-- CreateTable
CREATE TABLE "DisputeItem" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "claimedQuantity" INTEGER NOT NULL,
    "approvedQuantity" INTEGER,
    "outcome" "DisputeItemOutcome",
    "calculatedRefundAmount" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisputeItem_orderItemId_idx" ON "DisputeItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeItem_disputeId_orderItemId_key" ON "DisputeItem"("disputeId", "orderItemId");

-- AddForeignKey
ALTER TABLE "DisputeItem" ADD CONSTRAINT "DisputeItem_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeItem" ADD CONSTRAINT "DisputeItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
