import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const REVIEW_PAGE_SIZE_MAX = 50;

type CreateStoreReviewInput = {
  storeId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment?: string;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function listStoreReviews(storeId: string, page = 1, limit = 10) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, status: true },
  });

  if (!store || store.status !== "ACTIVE") {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isSafeInteger(limit) && limit > 0
      ? Math.min(limit, REVIEW_PAGE_SIZE_MAX)
      : 10;

  const [reviews, total] = await Promise.all([
    prisma.storeReview.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      select: {
        id: true,
        storeId: true,
        userId: true,
        orderId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.storeReview.count({ where: { storeId } }),
  ]);

  return {
    reviews,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function createStoreReview(input: CreateStoreReviewInput) {
  const { storeId, userId, orderId, rating, comment } = input;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(
      400,
      "Rating must be an integer between 1 and 5",
      "INVALID_RATING",
    );
  }

  if (comment !== undefined && comment.length > 5000) {
    throw new ApiError(
      400,
      "Review comment cannot exceed 5000 characters",
      "INVALID_REVIEW_COMMENT",
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({
        where: { id: storeId },
        select: { id: true, status: true },
      });

      if (!store || store.status !== "ACTIVE") {
        throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          userId: true,
          storeId: true,
          status: true,
          paymentStatus: true,
          hasReviewed: true,
        },
      });

      if (!order || order.storeId !== storeId || order.userId !== userId) {
        throw new ApiError(
          403,
          "You can only review a store for your own order",
          "ORDER_NOT_ELIGIBLE_FOR_REVIEW",
        );
      }

      if (order.status !== "DELIVERED") {
        throw new ApiError(
          400,
          "You can review a store only after delivery",
          "ORDER_NOT_DELIVERED",
        );
      }

      if (
        order.paymentStatus !== "PAID" &&
        order.paymentStatus !== "PARTIALLY_REFUNDED"
      ) {
        throw new ApiError(
          400,
          "This order is not eligible for a store review",
          "ORDER_NOT_ELIGIBLE_FOR_REVIEW",
        );
      }

      if (order.hasReviewed) {
        throw new ApiError(
          409,
          "This order has already been reviewed",
          "ORDER_ALREADY_REVIEWED",
        );
      }

      const review = await tx.storeReview.create({
        data: {
          storeId,
          userId,
          orderId,
          rating,
          comment: comment?.trim() || null,
        },
        select: {
          id: true,
          storeId: true,
          userId: true,
          orderId: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { hasReviewed: true },
      });

      const aggregate = await tx.storeReview.aggregate({
        where: { storeId },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.store.update({
        where: { id: storeId },
        data: {
          ratingStars: aggregate._avg.rating ?? 0,
          ratingCount: aggregate._count._all,
        },
      });

      return review;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(
        409,
        "This order has already been reviewed",
        "ORDER_ALREADY_REVIEWED",
      );
    }

    throw error;
  }
}
