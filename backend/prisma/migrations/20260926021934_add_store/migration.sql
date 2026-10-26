-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StoreCategory" AS ENUM ('GENERAL', 'FASHION', 'ELECTRONICS', 'SPORTS', 'BEAUTY', 'HOME', 'AUTOMOTIVE', 'FOOD', 'SERVICES', 'EDUCATION', 'HEALTH', 'TRAVEL', 'ENTERTAINMENT', 'ART', 'AGRICULTURE', 'MUSIC', 'REAL_ESTATE', 'OTHER');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "handle" TEXT,
    "tagline" TEXT,
    "about" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "location" TEXT,
    "category" "StoreCategory" NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
    "ratingStars" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "socialLinks" JSONB,
    "bankDetails" JSONB,
    "policies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Store_handle_key" ON "Store"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Store_ownerId_key" ON "Store"("ownerId");

-- CreateIndex
CREATE INDEX "Store_status_idx" ON "Store"("status");

-- CreateIndex
CREATE INDEX "Store_category_idx" ON "Store"("category");

-- CreateIndex
CREATE INDEX "Store_isVerified_idx" ON "Store"("isVerified");

-- CreateIndex
CREATE INDEX "Store_createdAt_idx" ON "Store"("createdAt");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
