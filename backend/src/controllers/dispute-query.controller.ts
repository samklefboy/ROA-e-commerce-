import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import {
  getAdminDisputeById,
  getAdminDisputes,
  getBuyerDisputes,
  getDisputeForParticipant,
  getSellerDisputes,
} from "../services/dispute-query.service.js";

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

export async function getMyDisputesController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const disputes = await getBuyerDisputes(user.id);

  return res.status(200).json({
    success: true,
    data: disputes,
  });
}

export async function getSellerDisputesController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);

  // Confirm the caller currently owns a store before treating them
  // as a seller. The query also restricts results to that store owner.
  const store = await prisma.store.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!store) {
    throw new ApiError(
      403,
      "You must own a store to access seller disputes",
      "SELLER_ACCESS_REQUIRED",
    );
  }

  const disputes = await getSellerDisputes(user.id);

  return res.status(200).json({
    success: true,
    data: disputes,
  });
}

export async function getDisputeController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);
  const disputeId = requireDisputeId(req);

  const dispute = await getDisputeForParticipant(disputeId, user.id);

  return res.status(200).json({
    success: true,
    data: dispute,
  });
}

export async function getAdminDisputesController(_req: Request, res: Response) {
  const disputes = await getAdminDisputes();

  return res.status(200).json({
    success: true,
    data: disputes,
  });
}

export async function getAdminDisputeController(req: Request, res: Response) {
  const disputeId = requireDisputeId(req);
  const dispute = await getAdminDisputeById(disputeId);

  return res.status(200).json({
    success: true,
    data: dispute,
  });
}
