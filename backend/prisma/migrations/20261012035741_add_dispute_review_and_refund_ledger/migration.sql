/*
  Warnings:

  - A unique constraint covering the columns `[walletLedgerId]` on the table `Refund` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "adminReviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "walletLedgerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Refund_walletLedgerId_key" ON "Refund"("walletLedgerId");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_walletLedgerId_fkey" FOREIGN KEY ("walletLedgerId") REFERENCES "WalletLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
