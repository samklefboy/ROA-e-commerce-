import type { Request, Response } from "express";

import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart.service.js";

import {
  addToCartSchema,
  updateCartItemSchema,
} from "../utils/validators/cart.validator.js";

import { ApiError } from "../utils/api-error.js";

function getRouteParam(
  value: string | string[] | undefined,
  name: string,
): string {
  if (typeof value !== "string" || !value) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
}

export async function getCartController(req: Request, res: Response) {
  const cart = await getCart(req.authUser.id);

  res.status(200).json({
    success: true,
    data: cart,
  });
}

export async function addToCartController(req: Request, res: Response) {
  const parsed = addToCartSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid cart item");
  }

  const item = await addToCart(req.authUser.id, {
    productId: parsed.data.productId,
    quantity: parsed.data.quantity,
    variant: parsed.data.variant ?? null,
  });

  res.status(201).json({
    success: true,
    message: "Product added to cart",
    data: item,
  });
}

export async function updateCartItemController(req: Request, res: Response) {
  const cartItemId = getRouteParam(req.params.id, "Cart item ID");

  const parsed = updateCartItemSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid quantity");
  }

  const item = await updateCartItem(req.authUser.id, cartItemId, parsed.data);

  res.status(200).json({
    success: true,
    message: "Cart updated successfully",
    data: item,
  });
}

export async function removeCartItemController(req: Request, res: Response) {
  const cartItemId = getRouteParam(req.params.id, "Cart item ID");

  const result = await removeCartItem(req.authUser.id, cartItemId);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function clearCartController(req: Request, res: Response) {
  const result = await clearCart(req.authUser.id);

  res.status(200).json({
    success: true,
    data: result,
  });
}
