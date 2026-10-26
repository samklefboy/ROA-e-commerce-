import type { Request, Response } from "express";

import {
  createStoreReport,
  listMyStoreReports,
} from "../services/store-report.service.js";
import { ApiError } from "../utils/api-error.js";

function getRequiredParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `Invalid or missing route parameter: ${name}`);
  }

  return value;
}

function getAuthenticatedUserId(req: Request): string {
  const userId = req.authUser?.id;

  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  return userId;
}

function parsePositiveInteger(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined) return undefined;

  const parsed =
    typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new ApiError(400, `${field} must be a positive integer`);
  }

  return parsed;
}

export async function createStoreReportController(req: Request, res: Response) {
  const reporterId = getAuthenticatedUserId(req);

  const report = await createStoreReport(reporterId, {
    storeId: getRequiredParam(req, "storeId"),
    orderId: req.body.orderId ?? null,
    reason: req.body.reason,
    description: req.body.description,
  });

  return res.status(201).json({
    success: true,
    message: "Store report submitted successfully",
    data: report,
  });
}

export async function listMyStoreReportsController(
  req: Request,
  res: Response,
) {
  const reporterId = getAuthenticatedUserId(req);

  const page = parsePositiveInteger(req.query.page, "page");
  const limit = parsePositiveInteger(req.query.limit, "limit");

  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;

  const result = await listMyStoreReports(reporterId, {
    ...(page !== undefined && { page }),
    ...(limit !== undefined && { limit }),
    ...(status !== undefined && { status: status as never }),
  });

  return res.status(200).json({
    success: true,
    message: "Your store reports retrieved successfully",
    data: result,
  });
}
