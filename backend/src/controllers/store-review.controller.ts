import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createStoreReview,
  listStoreReviews,
} from "../services/store-review.service.js";
import { ApiError } from "../utils/api-error.js";

function getStoreId(req: Request): string {
  const storeId = req.params.storeId;

  if (typeof storeId !== "string" || storeId.trim().length === 0) {
    throw new ApiError(400, "Invalid store ID", "INVALID_STORE_ID");
  }

  return storeId;
}

const createReviewSchema = z.object({
  orderId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional(),
});

function getAuthUserId(req: Request): string {
  const userId = req.authUser?.id;

  if (!userId) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  return userId;
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function listStoreReviewsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await listStoreReviews(
      getStoreId(req),
      parsePositiveInteger(req.query.page, 1),
      parsePositiveInteger(req.query.limit, 10),
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createStoreReviewController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createReviewSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid store review data",
        "INVALID_REVIEW_DATA",
      );
    }

    const review = await createStoreReview({
      storeId: getStoreId(req),
      userId: getAuthUserId(req),
      orderId: parsed.data.orderId,
      rating: parsed.data.rating,
      ...(parsed.data.comment !== undefined
        ? { comment: parsed.data.comment }
        : {}),
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}
