import type { Request, Response } from "express";

import { submitDeliveryEvidence } from "../services/delivery-evidence.service.js";
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

export async function submitDeliveryEvidenceController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const orderId = req.params.id;

  if (typeof orderId !== "string" || !orderId.trim()) {
    throw new ApiError(400, "Valid order ID is required", "ORDER_ID_REQUIRED");
  }

  const body = req.body as {
    evidenceType?: unknown;
    fileUrls?: unknown;
    recipientName?: unknown;
    deliveryNote?: unknown;
  };

  if (
    typeof body.evidenceType !== "string" ||
    (body.fileUrls !== undefined &&
      (!Array.isArray(body.fileUrls) ||
        !body.fileUrls.every((url) => typeof url === "string"))) ||
    (body.recipientName !== undefined &&
      typeof body.recipientName !== "string") ||
    (body.deliveryNote !== undefined && typeof body.deliveryNote !== "string")
  ) {
    throw new ApiError(
      400,
      "Invalid delivery evidence payload",
      "INVALID_DELIVERY_EVIDENCE",
    );
  }

  const evidence = await submitDeliveryEvidence({
    sellerId: user.id,
    orderId,
    evidenceType: body.evidenceType,
    ...(body.fileUrls !== undefined
      ? { fileUrls: body.fileUrls as string[] }
      : {}),
    ...(body.recipientName !== undefined
      ? { recipientName: body.recipientName }
      : {}),
    ...(body.deliveryNote !== undefined
      ? { deliveryNote: body.deliveryNote }
      : {}),
  });

  return res.status(201).json({
    success: true,
    message: "Delivery evidence submitted for review",
    data: evidence,
  });
}
