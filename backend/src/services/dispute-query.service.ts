import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const disputeSummarySelect = {
  id: true,
  orderId: true,
  escrowId: true,
  buyerId: true,
  sellerId: true,
  reason: true,
  status: true,
  description: true,
  evidence: true,
  sellerResponse: true,
  resolutionNote: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      currency: true,
      createdAt: true,
      store: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  },
} as const;

export async function getBuyerDisputes(buyerId: string) {
  return prisma.dispute.findMany({
    where: { buyerId },
    select: disputeSummarySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSellerDisputes(sellerId: string) {
  return prisma.dispute.findMany({
    where: {
      sellerId,
      order: {
        store: {
          ownerId: sellerId,
        },
      },
    },
    select: disputeSummarySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminDisputes() {
  return prisma.dispute.findMany({
    select: disputeSummarySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getDisputeForParticipant(
  disputeId: string,
  userId: string,
) {
  const dispute = await prisma.dispute.findFirst({
    where: {
      id: disputeId,
      OR: [
        { buyerId: userId },
        {
          sellerId: userId,
          order: {
            store: {
              ownerId: userId,
            },
          },
        },
      ],
    },
    select: disputeSummarySelect,
  });

  if (!dispute) {
    // Use the same response for missing and unauthorized disputes,
    // so callers cannot use this endpoint to enumerate other cases.
    throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
  }

  return dispute;
}

export async function getAdminDisputeById(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: disputeSummarySelect,
  });

  if (!dispute) {
    throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
  }

  return dispute;
}
