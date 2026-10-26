import {
  DisputeStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  Prisma,
} from "../../generated/prisma/client.js";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

type SellerDisputeResponseInput = {
  disputeId: string;
  sellerId: string;
  response: string;
};

const RESPONDABLE_STATUSES: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.UNDER_REVIEW,
];

export async function respondToDispute(input: SellerDisputeResponseInput) {
  const response = input.response.trim();

  if (!response) {
    throw new ApiError(
      400,
      "A seller response is required",
      "DISPUTE_RESPONSE_REQUIRED",
    );
  }

  if (response.length < 10) {
    throw new ApiError(
      400,
      "The response must contain at least 10 characters",
      "DISPUTE_RESPONSE_TOO_SHORT",
    );
  }

  if (response.length > 5000) {
    throw new ApiError(
      400,
      "The response cannot exceed 5000 characters",
      "DISPUTE_RESPONSE_TOO_LONG",
    );
  }

  return prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({
      where: { id: input.disputeId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            store: {
              select: {
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
    }

    if (
      dispute.sellerId !== input.sellerId ||
      dispute.order.store.ownerId !== input.sellerId
    ) {
      throw new ApiError(
        403,
        "You are not authorized to respond to this dispute",
        "DISPUTE_SELLER_FORBIDDEN",
      );
    }

    if (!RESPONDABLE_STATUSES.includes(dispute.status)) {
      throw new ApiError(
        409,
        "This dispute is no longer accepting seller responses",
        "DISPUTE_NOT_RESPONDABLE",
      );
    }

    const now = new Date();

    // Claim the response only while the dispute remains active.
    // A concurrent resolution must not be overwritten.
    const updated = await tx.dispute.updateMany({
      where: {
        id: dispute.id,
        sellerId: input.sellerId,
        status: {
          in: [...RESPONDABLE_STATUSES],
        },
      },
      data: {
        sellerResponse: response,
      },
    });

    if (updated.count !== 1) {
      throw new ApiError(
        409,
        "The dispute changed while you were responding. Refresh and try again",
        "DISPUTE_RESPONSE_CONFLICT",
      );
    }

    const notification = await tx.notification.create({
      data: {
        recipientId: dispute.buyerId,
        type: "DISPUTE_SELLER_RESPONDED",
        title: "Seller responded to your dispute",
        message:
          `The seller has responded to your dispute for order ` +
          `${dispute.order.orderNumber}.`,
        data: {
          disputeId: dispute.id,
          orderId: dispute.order.id,
          orderNumber: dispute.order.orderNumber,
        } satisfies Prisma.InputJsonObject,
        dedupeKey: `dispute-seller-response:${dispute.id}:${now.getTime()}`,
      },
    });

    await tx.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationDeliveryStatus.PENDING,
      },
    });

    return tx.dispute.findUniqueOrThrow({
      where: { id: dispute.id },
      select: {
        id: true,
        orderId: true,
        sellerId: true,
        reason: true,
        status: true,
        description: true,
        sellerResponse: true,
        updatedAt: true,
      },
    });
  });
}
