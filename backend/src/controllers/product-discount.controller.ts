import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import {
  createProductDiscount,
  endProductDiscount,
  listStoreProductDiscounts,
  updateProductDiscount,
} from "../services/product-discount.service.js";

const discountSchema = z.object({
  percentage: z.number().int().min(1).max(90),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

function getParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || !value) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
}

async function getSellerStoreId(userId: string): Promise<string> {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!store) {
    throw new ApiError(403, "You do not have a store");
  }

  if (store.status !== "ACTIVE") {
    throw new ApiError(403, "Your store must be active to manage discounts");
  }

  return store.id;
}

function requireUserId(req: Request): string {
  if (!req.authUser?.id) {
    throw new ApiError(401, "Authentication required");
  }

  return req.authUser.id;
}

function parseDiscountInput(body: unknown) {
  const parsed = discountSchema.parse(body);

  return {
    percentage: parsed.percentage,
    ...(parsed.startsAt !== undefined
      ? { startsAt: new Date(parsed.startsAt) }
      : {}),
    ...(parsed.endsAt !== undefined
      ? {
          endsAt: parsed.endsAt === null ? null : new Date(parsed.endsAt),
        }
      : {}),
  };
}

export async function createProductDiscountController(
  req: Request,
  res: Response,
) {
  const userId = requireUserId(req);
  const storeId = await getSellerStoreId(userId);
  const productId = getParam(req.params.id, "Product ID");
  const input = parseDiscountInput(req.body);

  const discount = await createProductDiscount(productId, storeId, input);

  return res.status(201).json({
    success: true,
    message: "Product discount created successfully",
    data: discount,
  });
}

export async function listProductDiscountsController(
  req: Request,
  res: Response,
) {
  const userId = requireUserId(req);
  const storeId = await getSellerStoreId(userId);

  const discounts = await listStoreProductDiscounts(storeId);

  return res.status(200).json({
    success: true,
    message: "Product discounts fetched successfully",
    data: discounts,
  });
}

export async function updateProductDiscountController(
  req: Request,
  res: Response,
) {
  const userId = requireUserId(req);
  const storeId = await getSellerStoreId(userId);
  const productId = getParam(req.params.id, "Product ID");
  const input = parseDiscountInput(req.body);

  const discount = await updateProductDiscount(productId, storeId, input);

  return res.status(200).json({
    success: true,
    message: "Product discount updated successfully",
    data: discount,
  });
}

export async function endProductDiscountController(
  req: Request,
  res: Response,
) {
  const userId = requireUserId(req);
  const storeId = await getSellerStoreId(userId);
  const productId = getParam(req.params.id, "Product ID");

  const discount = await endProductDiscount(productId, storeId);

  return res.status(200).json({
    success: true,
    message: "Product discount ended successfully",
    data: discount,
  });
}
