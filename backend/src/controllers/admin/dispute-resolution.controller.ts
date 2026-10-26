import type { Request, Response } from "express";

import {
  DisputeItemOutcome,
  DisputeResolutionOutcome,
} from "../../../generated/prisma/client.js";

import { resolveDispute } from "../../services/admin/admin-dispute-resolution.service.js";
import { ApiError } from "../../utils/api-error.js";

export async function resolveDisputeController(req: Request, res: Response) {
  const user = req.authUser;

  if (!user) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const disputeId = req.params.id;

  if (typeof disputeId !== "string" || !disputeId.trim()) {
    throw new ApiError(
      400,
      "A valid dispute ID is required",
      "INVALID_DISPUTE_ID",
    );
  }

  const body: unknown = req.body;

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(
      400,
      "Request body must be an object",
      "INVALID_RESOLUTION_BODY",
    );
  }

  const payload = body as Record<string, unknown>;
  const outcome = payload.outcome;
  const resolutionNote = payload.resolutionNote;
  const rawItemDecisions = payload.itemDecisions;

  if (
    typeof outcome !== "string" ||
    !Object.values(DisputeResolutionOutcome).includes(
      outcome as DisputeResolutionOutcome,
    )
  ) {
    throw new ApiError(
      400,
      "A valid dispute resolution outcome is required",
      "INVALID_RESOLUTION_OUTCOME",
    );
  }

  if (typeof resolutionNote !== "string") {
    throw new ApiError(
      400,
      "A resolution note is required",
      "INVALID_RESOLUTION_NOTE",
    );
  }

  if (rawItemDecisions !== undefined && !Array.isArray(rawItemDecisions)) {
    throw new ApiError(
      400,
      "Item decisions must be an array",
      "INVALID_ITEM_DECISIONS",
    );
  }

  const itemDecisions: {
    disputeItemId: string;
    outcome: DisputeItemOutcome;
    approvedQuantity: number;
  }[] = [];

  if (Array.isArray(rawItemDecisions)) {
    for (const decision of rawItemDecisions) {
      if (
        typeof decision !== "object" ||
        decision === null ||
        Array.isArray(decision)
      ) {
        throw new ApiError(
          400,
          "Each item decision must be an object",
          "INVALID_ITEM_DECISION",
        );
      }

      const item = decision as Record<string, unknown>;

      if (
        typeof item.disputeItemId !== "string" ||
        !item.disputeItemId.trim()
      ) {
        throw new ApiError(
          400,
          "Each item decision requires a valid dispute item ID",
          "INVALID_DISPUTE_ITEM_ID",
        );
      }

      if (
        typeof item.outcome !== "string" ||
        !Object.values(DisputeItemOutcome).includes(
          item.outcome as DisputeItemOutcome,
        )
      ) {
        throw new ApiError(
          400,
          "Each item decision requires a valid outcome",
          "INVALID_ITEM_OUTCOME",
        );
      }

      if (
        typeof item.approvedQuantity !== "number" ||
        !Number.isSafeInteger(item.approvedQuantity) ||
        item.approvedQuantity < 0
      ) {
        throw new ApiError(
          400,
          "Approved quantity must be a non-negative whole number",
          "INVALID_APPROVED_QUANTITY",
        );
      }

      itemDecisions.push({
        disputeItemId: item.disputeItemId.trim(),
        outcome: item.outcome as DisputeItemOutcome,
        approvedQuantity: item.approvedQuantity,
      });
    }
  }

  const result = await resolveDispute({
    disputeId: disputeId.trim(),
    adminId: user.id,
    outcome: outcome as DisputeResolutionOutcome,
    resolutionNote,
    ...(Array.isArray(rawItemDecisions) ? { itemDecisions } : {}),
  });

  return res.status(200).json({
    success: true,
    message: "Dispute resolved successfully",
    data: result,
  });
}
