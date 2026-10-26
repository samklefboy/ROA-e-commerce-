/*
  Warnings:

  - The values [DELIVERY_FEE_COMPENSATION] on the enum `DisputeResolutionOutcome` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DisputeResolutionOutcome_new" AS ENUM ('REJECTED', 'PRODUCT_COMPENSATION', 'SELLER_RESPONSIBLE_NON_DELIVERY');
ALTER TABLE "Dispute" ALTER COLUMN "resolutionOutcome" TYPE "DisputeResolutionOutcome_new" USING ("resolutionOutcome"::text::"DisputeResolutionOutcome_new");
ALTER TYPE "DisputeResolutionOutcome" RENAME TO "DisputeResolutionOutcome_old";
ALTER TYPE "DisputeResolutionOutcome_new" RENAME TO "DisputeResolutionOutcome";
DROP TYPE "public"."DisputeResolutionOutcome_old";
COMMIT;
