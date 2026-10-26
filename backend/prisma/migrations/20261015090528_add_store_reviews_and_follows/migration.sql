-- CreateTable
CREATE TABLE "StoreReview" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreFollow" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreFollow_pkey" PRIMARY KEY ("userId","storeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreReview_orderId_key" ON "StoreReview"("orderId");

-- CreateIndex
CREATE INDEX "StoreReview_storeId_createdAt_idx" ON "StoreReview"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReview_userId_createdAt_idx" ON "StoreReview"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReview_rating_idx" ON "StoreReview"("rating");

-- CreateIndex
CREATE INDEX "StoreFollow_storeId_followedAt_idx" ON "StoreFollow"("storeId", "followedAt");

-- CreateIndex
CREATE INDEX "StoreFollow_userId_followedAt_idx" ON "StoreFollow"("userId", "followedAt");

-- AddForeignKey
ALTER TABLE "StoreReview" ADD CONSTRAINT "StoreReview_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReview" ADD CONSTRAINT "StoreReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReview" ADD CONSTRAINT "StoreReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreFollow" ADD CONSTRAINT "StoreFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreFollow" ADD CONSTRAINT "StoreFollow_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
