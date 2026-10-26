import type { Request, Response } from "express";

import { reviewDeliveryEvidence } from "../../services/admin/delivery-evidence-review.service.js";
import { ApiError } from "../../utils/api-error.js";

type AuthenticatedRequest = Request & {
  authUser?: {
    id: string;
    phone: string;
  };
};

export async function reviewDeliveryEvidenceController(
  req: Request,
  res: Response,
) {
  const authReq = req as AuthenticatedRequest;
  const adminId = authReq.authUser?.id;

  if (!adminId) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const evidenceId = req.params.id;

  if (typeof evidenceId !== "string" || !evidenceId.trim()) {
    throw new ApiError(
      400,
      "A valid evidence ID is required",
      "INVALID_EVIDENCE_ID",
    );
  }

  const body: unknown = req.body;

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(
      400,
      "Request body must be an object",
      "INVALID_REVIEW_BODY",
    );
  }

  const payload = body as Record<string, unknown>;
  const decision = payload.decision;
  const reviewNote = payload.reviewNote;

  if (decision !== "ACCEPT" && decision !== "REJECT") {
    throw new ApiError(
      400,
      "Decision must be ACCEPT or REJECT",
      "INVALID_REVIEW_DECISION",
    );
  }

  if (reviewNote !== undefined && typeof reviewNote !== "string") {
    throw new ApiError(
      400,
      "Review note must be a string",
      "INVALID_REVIEW_NOTE",
    );
  }

  const evidence = await reviewDeliveryEvidence({
    evidenceId,
    adminId,
    decision,
    ...(typeof reviewNote === "string" ? { reviewNote } : {}),
  });

  return res.status(200).json({
    success: true,
    message:
      decision === "ACCEPT"
        ? "Delivery evidence accepted. Escrow remains held."
        : "Delivery evidence rejected. The order remains in delivery.",
    data: evidence,
  });
}
