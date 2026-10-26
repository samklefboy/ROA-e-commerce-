import type { Request, Response } from "express";
import { StoreStatus } from "../../../generated/prisma/client.js";

import {
  getAdminStoreById,
  listAdminStores,
  reinstateAdminStore,
  suspendAdminStore,
} from "../../services/admin/admin-store.service.js";
import { ApiError } from "../../utils/api-error.js";

function getAdminId(req: Request): string {
  const authUser = (
    req as Request & {
      authUser?: { id: string; phone: string };
    }
  ).authUser;

  if (!authUser) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  return authUser.id;
}

function getStoreId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string" || id.trim().length === 0) {
    throw new ApiError(400, "Invalid store ID", "INVALID_STORE_ID");
  }

  return id;
}

function parsePositiveInteger(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new ApiError(
      400,
      `${field} must be a positive integer`,
      "INVALID_PAGINATION",
    );
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new ApiError(
      400,
      `${field} is outside the allowed range`,
      "INVALID_PAGINATION",
    );
  }

  return parsed;
}

function parseStoreStatus(value: unknown): StoreStatus | undefined {
  if (value === undefined) return undefined;

  if (
    typeof value !== "string" ||
    !Object.values(StoreStatus).includes(value as StoreStatus)
  ) {
    throw new ApiError(400, "Invalid store status", "INVALID_STORE_STATUS");
  }

  return value as StoreStatus;
}

function parseReason(body: unknown): string {
  if (
    body === null ||
    typeof body !== "object" ||
    !("reason" in body) ||
    typeof body.reason !== "string"
  ) {
    throw new ApiError(
      400,
      "A reason is required",
      "STORE_STATUS_REASON_REQUIRED",
    );
  }

  const reason = body.reason.trim();

  if (reason.length < 5 || reason.length > 1000) {
    throw new ApiError(
      400,
      "Reason must be between 5 and 1000 characters",
      "INVALID_STORE_STATUS_REASON",
    );
  }

  return reason;
}

export async function listAdminStoresController(req: Request, res: Response) {
  const status = parseStoreStatus(req.query.status);
  const page = parsePositiveInteger(req.query.page, "page");
  const limit = parsePositiveInteger(req.query.limit, "limit");
  const search = req.query.search;

  if (search !== undefined && typeof search !== "string") {
    throw new ApiError(400, "Invalid search query", "INVALID_STORE_SEARCH");
  }

  if (typeof search === "string" && search.trim().length > 100) {
    throw new ApiError(
      400,
      "Search query cannot exceed 100 characters",
      "INVALID_STORE_SEARCH",
    );
  }

  const result = await listAdminStores({
    ...(status !== undefined ? { status } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(typeof search === "string" && search.trim()
      ? { search: search.trim() }
      : {}),
  });

  return res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}

export async function getAdminStoreController(req: Request, res: Response) {
  const store = await getAdminStoreById(getStoreId(req));

  return res.status(200).json({
    success: true,
    data: store,
  });
}

export async function suspendStoreController(req: Request, res: Response) {
  const store = await suspendAdminStore({
    storeId: getStoreId(req),
    adminId: getAdminId(req),
    reason: parseReason(req.body),
  });

  return res.status(200).json({
    success: true,
    message: "Store suspended successfully",
    data: store,
  });
}

export async function reinstateStoreController(req: Request, res: Response) {
  const store = await reinstateAdminStore({
    storeId: getStoreId(req),
    adminId: getAdminId(req),
    reason: parseReason(req.body),
  });

  return res.status(200).json({
    success: true,
    message: "Store reinstated successfully",
    data: store,
  });
}
