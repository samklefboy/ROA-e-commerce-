import type { Request, Response } from "express";
import {
  cancelOrder,
  createOrders,
  getOrderById,
  getOrders,
  confirmSellerOrder,
  dispatchSellerOrder,
  confirmBuyerDelivery,
} from "../services/order.service.js";
import {
  cancelOrderSchema,
  createOrderSchema,
  orderListQuerySchema,
} from "../utils/validators/order.validation.js";
import { ApiError } from "../utils/api-error.js";

type AuthenticatedRequest = Request & {
  authUser?: {
    id: string;
    phone: string;
  };
};

function requireAuthUser(req: AuthenticatedRequest) {
  if (!req.authUser) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  return req.authUser;
}

function requireOrderId(req: Request): string {
  const orderId = req.params.id;

  if (!orderId || Array.isArray(orderId)) {
    throw new ApiError(400, "Valid order ID is required");
  }

  return orderId;
}

export async function createOrderController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);

  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid order request", "VALIDATION_ERROR");
  }

  const result = await createOrders(user, parsed.data);

  return res.status(201).json({
    success: true,
    data: result,
  });
}

export async function getOrdersController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);

  const parsed = orderListQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid order query", "VALIDATION_ERROR");
  }

  const result = await getOrders(user.id, parsed.data);

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getOrderController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);

  const orderId = requireOrderId(req);

  const order = await getOrderById(user.id, orderId);

  return res.status(200).json({
    success: true,
    data: order,
  });
}

export async function cancelOrderController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);

  const orderId = requireOrderId(req);

  const parsed = cancelOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid cancellation request", "VALIDATION_ERROR");
  }

  const order = await cancelOrder(user.id, orderId, parsed.data);

  return res.status(200).json({
    success: true,
    data: order,
  });
}

export async function confirmSellerOrderController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const orderId = requireOrderId(req);

  const order = await confirmSellerOrder(user.id, orderId);

  return res.status(200).json({
    success: true,
    data: order,
  });
}

export async function dispatchSellerOrderController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const orderId = requireOrderId(req);

  const order = await dispatchSellerOrder(user.id, orderId);

  return res.status(200).json({
    success: true,
    data: order,
  });
}

export async function confirmBuyerDeliveryController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const orderId = requireOrderId(req);

  const order = await confirmBuyerDelivery(user.id, orderId);

  return res.status(200).json({
    success: true,
    message: "Delivery confirmed. Your 36-hour inspection window has started.",
    data: order,
  });
}
