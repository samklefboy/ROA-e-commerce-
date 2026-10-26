import {
  NotificationChannel,
  NotificationDeliveryStatus,
  Prisma,
} from "../../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type AdminReviewDisputeInput = {
  disputeId: string;
  adminId: string;
  reviewNote?: string;
};

export async function reviewDispute(input: AdminReviewDisputeInput) {
  const disputeId = input.disputeId?.trim();
  const adminId = input.adminId?.trim();
  const reviewNote = input.reviewNote?.trim();

  if (!disputeId || !adminId) {
    throw new ApiError(
      400,
      "Dispute ID and admin ID are required",
      "DISPUTE_REVIEW_INPUT_INVALID",
    );
  }

  if (reviewNote && reviewNote.length > 5000) {
    throw new ApiError(
      400,
      "Review note cannot exceed 5000 characters",
      "DISPUTE_REVIEW_NOTE_TOO_LONG",
    );
  }

  return prisma.$transaction(
    async (tx) => {
      // Read the order relationship so we can lock Order before Dispute.
      const disputeLocator = await tx.dispute.findUnique({
        where: { id: disputeId },
        select: { orderId: true },
      });

      if (!disputeLocator) {
        throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
      }

      // 1. Lock Order first to match the financial services.
      const lockedOrders = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Order"
    WHERE "id" = ${disputeLocator.orderId}
    FOR UPDATE
  `;

      if (lockedOrders.length !== 1) {
        throw new ApiError(
          404,
          "The order associated with this dispute was not found",
          "DISPUTE_ORDER_NOT_FOUND",
        );
      }

      // 2. Lock Dispute after Order.
      const lockedDisputes = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Dispute"
    WHERE "id" = ${disputeId}
    FOR UPDATE
  `;

      if (lockedDisputes.length !== 1) {
        throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
      }

      // Reload the latest state only after acquiring the locks.
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
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

      if (dispute.orderId !== disputeLocator.orderId) {
        throw new ApiError(
          409,
          "The dispute's order association changed unexpectedly",
          "DISPUTE_ORDER_MISMATCH",
        );
      }

      if (
        dispute.order.store.ownerId !== dispute.sellerId ||
        dispute.buyerId === dispute.sellerId
      ) {
        throw new ApiError(
          409,
          "Dispute participant records do not match the order",
          "DISPUTE_PARTIES_INVALID",
        );
      }

      if (dispute.status === "UNDER_REVIEW") {
        throw new ApiError(
          409,
          "This dispute is already under review",
          "DISPUTE_ALREADY_UNDER_REVIEW",
        );
      }

      if (dispute.status !== "OPEN") {
        throw new ApiError(
          409,
          "Only open disputes can enter admin review",
          "DISPUTE_NOT_OPEN",
        );
      }

      const reviewedAt = new Date();

      // Keep the conditional update as an additional state safeguard.
      const updated = await tx.dispute.updateMany({
        where: {
          id: dispute.id,
          orderId: dispute.orderId,
          status: "OPEN",
        },
        data: {
          status: "UNDER_REVIEW",
          adminReviewNote: reviewNote || null,
          reviewedAt,
        },
      });

      if (updated.count !== 1) {
        throw new ApiError(
          409,
          "The dispute has changed. Refresh and try again",
          "DISPUTE_STATE_CHANGED",
        );
      }

      const notificationData: Prisma.InputJsonObject = {
        disputeId: dispute.id,
        orderId: dispute.order.id,
        orderNumber: dispute.order.orderNumber,
        status: "UNDER_REVIEW",
      };

      const recipients = [
        {
          recipientId: dispute.buyerId,
          role: "buyer",
        },
        {
          recipientId: dispute.sellerId,
          role: "seller",
        },
      ];

      for (const recipient of recipients) {
        const notification = await tx.notification.create({
          data: {
            recipientId: recipient.recipientId,
            type: "DISPUTE_UNDER_REVIEW",
            title: "Dispute is under review",
            message:
              `The dispute for order ${dispute.order.orderNumber} ` +
              "is now being reviewed by ROA's admin team.",
            data: notificationData,
            dedupeKey: `dispute-under-review:${dispute.id}:${recipient.role}`,
          },
        });

        await tx.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel: NotificationChannel.IN_APP,
            status: NotificationDeliveryStatus.PENDING,
          },
        });
      }

      return tx.dispute.findUniqueOrThrow({
        where: { id: dispute.id },
        select: {
          id: true,
          orderId: true,
          buyerId: true,
          sellerId: true,
          reason: true,
          status: true,
          adminReviewNote: true,
          reviewedAt: true,
          updatedAt: true,
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 10_000,
      timeout: 15_000,
    },
  );
}
