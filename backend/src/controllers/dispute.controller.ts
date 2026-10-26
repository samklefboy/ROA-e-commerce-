import type { Request, Response } from "express";

import { openDispute } from "../services/dispute.service.js";
import { ApiError } from "../utils/api-error.js";
import { openDisputeSchema } from "../utils/validators/dispute.validations.js";

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

export async function openDisputeController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const orderId = requireOrderId(req);

  const parsed = openDisputeSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid dispute request", "VALIDATION_ERROR");
  }

  const dispute = await openDispute({
    orderId,
    buyerId: user.id,
    reason: parsed.data.reason,
    description: parsed.data.description,
    ...(parsed.data.evidence !== undefined
      ? { evidence: parsed.data.evidence }
      : {}),
  });

  return res.status(201).json({
    success: true,
    data: dispute,
  });
}
