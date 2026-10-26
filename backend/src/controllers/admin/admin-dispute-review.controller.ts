import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { reviewDispute } from "../../services/admin/admin-dispute-review.servive.js";

export async function reviewDisputeController(req: Request, res: Response) {
  const user = req.authUser;

  if (!user) {
    throw new ApiError(401, "Authentication required");
  }

  const disputeId = req.params.id;

  if (!disputeId || typeof disputeId !== "string") {
    throw new ApiError(400, "A valid dispute ID is required");
  }

  const body: unknown = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Request body must be an object");
  }

  const reviewNote = (body as Record<string, unknown>).reviewNote;

  if (
    reviewNote !== undefined &&
    (typeof reviewNote !== "string" || reviewNote.length > 5000)
  ) {
    throw new ApiError(
      400,
      "Review note must be a string of at most 5000 characters",
    );
  }

  const dispute = await reviewDispute({
    disputeId,
    adminId: user.id,
    ...(typeof reviewNote === "string" ? { reviewNote } : {}),
  });

  res.status(200).json({
    success: true,
    message: "Dispute moved to admin review successfully",
    data: dispute,
  });
}
