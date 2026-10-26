import type { Request, Response, NextFunction } from "express";

import {
  followStore,
  getFollowedStores,
  getStoreFollowStatus,
  unfollowStore,
} from "../services/store-follow.service.js";
import { ApiError } from "../utils/api-error.js";

function getStoreId(req: Request): string {
  const storeId = req.params.storeId;

  if (typeof storeId !== "string" || storeId.trim().length === 0) {
    throw new ApiError(400, "Invalid store ID", "INVALID_STORE_ID");
  }

  return storeId;
}

function getAuthUserId(req: Request): string {
  const userId = req.authUser?.id;

  if (!userId) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  return userId;
}

function getPositiveIntegerQuery(
  req: Request,
  key: "page" | "limit",
  defaultValue: number,
  maximum: number,
): number {
  const rawValue = req.query[key];

  if (rawValue === undefined) {
    return defaultValue;
  }

  if (typeof rawValue !== "string" || !/^\d+$/.test(rawValue)) {
    throw new ApiError(
      400,
      `Invalid ${key} query parameter`,
      "INVALID_PAGINATION",
    );
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new ApiError(
      400,
      `${key} must be between 1 and ${maximum}`,
      "INVALID_PAGINATION",
    );
  }

  return value;
}

export async function followStoreController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await followStore(getStoreId(req), getAuthUserId(req));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function unfollowStoreController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await unfollowStore(getStoreId(req), getAuthUserId(req));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStoreFollowStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getStoreFollowStatus(
      getStoreId(req),
      getAuthUserId(req),
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowedStoresController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthUserId(req);

    const pageValue = req.query.page ?? "1";
    const limitValue = req.query.limit ?? "20";

    if (
      typeof pageValue !== "string" ||
      typeof limitValue !== "string" ||
      !/^\d+$/.test(pageValue) ||
      !/^\d+$/.test(limitValue)
    ) {
      throw new ApiError(
        400,
        "Page and limit must be positive integers",
        "INVALID_PAGINATION",
      );
    }

    const page = Number(pageValue);
    const limit = Number(limitValue);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1
    ) {
      throw new ApiError(
        400,
        "Page and limit must be positive integers",
        "INVALID_PAGINATION",
      );
    }

    const result = await getFollowedStores(userId, page, limit);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
