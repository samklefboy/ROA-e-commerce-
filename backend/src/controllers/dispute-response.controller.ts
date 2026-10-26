import type { Request, Response } from "express";

import { respondToDispute } from "../services/dispute-response.service.js";
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

function requireDisputeId(req: Request): string {
  const disputeId = req.params.id;

  if (!disputeId || Array.isArray(disputeId)) {
    throw new ApiError(400, "Valid dispute ID is required");
  }

  return disputeId;
}

export async function respondToDisputeController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const disputeId = requireDisputeId(req);

  if (
    typeof req.body?.response !== "string" ||
    req.body.response.trim().length < 10 ||
    req.body.response.trim().length > 5000
  ) {
    throw new ApiError(
      400,
      "Response must contain between 10 and 5000 characters",
      "VALIDATION_ERROR",
    );
  }

  const result = await respondToDispute({
    disputeId,
    sellerId: user.id,
    response: req.body.response,
  });

  return res.status(200).json({
    success: true,
    message: "Your response has been submitted",
    data: result,
  });
}
