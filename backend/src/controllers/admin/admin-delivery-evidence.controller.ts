import type { Request, Response } from "express";
import { DeliveryEvidenceStatus } from "../../../generated/prisma/client.js";

import { listDeliveryEvidence } from "../../services/admin/admin-delivery-evidence.service.js";
import { ApiError } from "../../utils/api-error.js";

export async function listDeliveryEvidenceController(
  req: Request,
  res: Response,
) {
  const statusParam = req.query.status;
  const pageParam = req.query.page;
  const limitParam = req.query.limit;

  let status: DeliveryEvidenceStatus | undefined;

  if (statusParam !== undefined) {
    if (
      typeof statusParam !== "string" ||
      !Object.values(DeliveryEvidenceStatus).includes(
        statusParam as DeliveryEvidenceStatus,
      )
    ) {
      throw new ApiError(
        400,
        "Invalid evidence status",
        "INVALID_EVIDENCE_STATUS",
      );
    }

    status = statusParam as DeliveryEvidenceStatus;
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

  const page = parsePositiveInteger(pageParam, "page");
  const limit = parsePositiveInteger(limitParam, "limit");

  const result = await listDeliveryEvidence({
    ...(status !== undefined ? { status } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
  });

  return res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}
