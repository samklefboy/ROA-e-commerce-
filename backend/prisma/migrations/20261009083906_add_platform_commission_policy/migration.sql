-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "KycVerificationType" AS ENUM ('PHONE', 'IDENTITY', 'BANK_ACCOUNT');

-- CreateEnum
CREATE TYPE "KycVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "KycProvider" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DeliveryEvidenceStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "KycProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "withdrawalPinHash" TEXT,
    "withdrawalPinSetAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycVerification" (
    "id" TEXT NOT NULL,
    "kycProfileId" TEXT NOT NULL,
    "type" "KycVerificationType" NOT NULL,
    "status" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "KycProvider" NOT NULL DEFAULT 'INTERNAL',
    "providerReference" TEXT,
    "verifiedValue" TEXT,
    "failureReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEvidence" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileUrls" JSONB,
    "recipientName" TEXT,
    "deliveryNote" TEXT,
    "status" "DeliveryEvidenceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "buyerNotifiedAt" TIMESTAMP(3),
    "buyerResponseDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KycProfile_userId_key" ON "KycProfile"("userId");

-- CreateIndex
CREATE INDEX "KycVerification_kycProfileId_idx" ON "KycVerification"("kycProfileId");

-- CreateIndex
CREATE INDEX "KycVerification_type_idx" ON "KycVerification"("type");

-- CreateIndex
CREATE INDEX "KycVerification_status_idx" ON "KycVerification"("status");

-- CreateIndex
CREATE INDEX "KycVerification_providerReference_idx" ON "KycVerification"("providerReference");

-- CreateIndex
CREATE INDEX "DeliveryEvidence_orderId_idx" ON "DeliveryEvidence"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryEvidence_sellerId_idx" ON "DeliveryEvidence"("sellerId");

-- CreateIndex
CREATE INDEX "DeliveryEvidence_status_buyerResponseDeadline_idx" ON "DeliveryEvidence"("status", "buyerResponseDeadline");

-- AddForeignKey
ALTER TABLE "KycProfile" ADD CONSTRAINT "KycProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycVerification" ADD CONSTRAINT "KycVerification_kycProfileId_fkey" FOREIGN KEY ("kycProfileId") REFERENCES "KycProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEvidence" ADD CONSTRAINT "DeliveryEvidence_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEvidence" ADD CONSTRAINT "DeliveryEvidence_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
