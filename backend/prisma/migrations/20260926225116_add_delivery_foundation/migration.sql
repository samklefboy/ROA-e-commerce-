/*
  Warnings:

  - The values [FAIRLY_USED,REFURBISHED] on the enum `ProductCondition` will be removed. If these variants are still used in the database, this will fail.
  - The values [OUT_OF_STOCK] on the enum `ProductStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "DeliveryRuleScope" AS ENUM ('STATE', 'ZONE', 'NATIONWIDE');

-- CreateEnum
CREATE TYPE "DeliveryProvider" AS ENUM ('SELLER', 'ROA', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('DELIVERY', 'PICKUP');

-- AlterEnum
BEGIN;
CREATE TYPE "ProductCondition_new" AS ENUM ('BRAND_NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'USED');
ALTER TABLE "public"."Product" ALTER COLUMN "condition" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "condition" TYPE "ProductCondition_new" USING ("condition"::text::"ProductCondition_new");
ALTER TYPE "ProductCondition" RENAME TO "ProductCondition_old";
ALTER TYPE "ProductCondition_new" RENAME TO "ProductCondition";
DROP TYPE "public"."ProductCondition_old";
ALTER TABLE "Product" ALTER COLUMN "condition" SET DEFAULT 'BRAND_NEW';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProductStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'HIDDEN');
ALTER TABLE "public"."Product" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "status" TYPE "ProductStatus_new" USING ("status"::text::"ProductStatus_new");
ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";
DROP TYPE "public"."ProductStatus_old";
ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'REALESTATE';
ALTER TYPE "ProductType" ADD VALUE 'CAR';

-- CreateTable
CREATE TABLE "DeliveryRule" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "scope" "DeliveryRuleScope" NOT NULL DEFAULT 'STATE',
    "stateCode" TEXT,
    "zoneCode" TEXT,
    "fee" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'NG',
    "landmark" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryRule_storeId_idx" ON "DeliveryRule"("storeId");

-- CreateIndex
CREATE INDEX "DeliveryRule_storeId_isActive_idx" ON "DeliveryRule"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "DeliveryRule_stateCode_idx" ON "DeliveryRule"("stateCode");

-- CreateIndex
CREATE INDEX "DeliveryRule_zoneCode_idx" ON "DeliveryRule"("zoneCode");

-- CreateIndex
CREATE INDEX "DeliveryRule_scope_idx" ON "DeliveryRule"("scope");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- AddForeignKey
ALTER TABLE "DeliveryRule" ADD CONSTRAINT "DeliveryRule_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
