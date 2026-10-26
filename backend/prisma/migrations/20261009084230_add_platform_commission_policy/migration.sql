-- CreateTable
CREATE TABLE "PlatformCommissionPolicy" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "rateBps" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCommissionPolicy_pkey" PRIMARY KEY ("id")
);
