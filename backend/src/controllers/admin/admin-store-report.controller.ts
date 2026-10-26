import type { Request, Response } from "express";

import {
  getAdminStoreReport,
  listAdminStoreReports,
  reviewAdminStoreReport,
} from "../../services/store-report.service.js";
import { ApiError } from "../../utils/api-error.js";

function getRequiredParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `Invalid or missing route parameter: ${name}`);
  }

  return value;
}

function getAuthenticatedAdminId(req: Request): string {
  const adminId = req.authUser?.id;

  if (!adminId) {
    throw new ApiError(401, "Authentication required");
  }

  return adminId;
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

export async function listAdminStoreReportsController(
  req: Request,
  res: Response,
) {
  getAuthenticatedAdminId(req);

  const page = parsePositiveInteger(req.query.page, "page");
  const limit = parsePositiveInteger(req.query.limit, "limit");

  const result = await listAdminStoreReports({
    ...(page !== undefined && { page }),
    ...(limit !== undefined && { limit }),
    ...(typeof req.query.status === "string" && {
      status: req.query.status as never,
    }),
    ...(typeof req.query.reason === "string" && {
      reason: req.query.reason as never,
    }),
    ...(typeof req.query.storeId === "string" && {
      storeId: req.query.storeId,
    }),
    ...(typeof req.query.reporterId === "string" && {
      reporterId: req.query.reporterId,
    }),
  });

  return res.status(200).json({
    success: true,
    message: "Store reports retrieved successfully",
    data: result,
  });
}

export async function getAdminStoreReportController(
  req: Request,
  res: Response,
) {
  getAuthenticatedAdminId(req);

  const reportId = getRequiredParam(req, "id");
  const report = await getAdminStoreReport(reportId);

  return res.status(200).json({
    success: true,
    message: "Store report retrieved successfully",
    data: report,
  });
}

export async function reviewAdminStoreReportController(
  req: Request,
  res: Response,
) {
  const adminId = getAuthenticatedAdminId(req);

 const reportId = getRequiredParam(req, "id");

 const report = await reviewAdminStoreReport(adminId, reportId, {
   status: req.body.status,
   adminNotes: req.body.adminNotes,
 });

  return res.status(200).json({
    success: true,
    message: "Store report reviewed successfully",
    data: report,
  });
}
