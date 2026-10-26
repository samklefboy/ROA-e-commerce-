import {
  DeliveryEvidenceStatus,
  DisputeStatus,
  EscrowStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "../../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type ReviewDecision = "ACCEPT" | "REJECT";

type ReviewDeliveryEvidenceInput = {
  evidenceId: string;
  adminId: string;
  decision: ReviewDecision;
  reviewNote?: string;
};

const BUYER_RESPONSE_WINDOW_MS = 36 * 60 * 60 * 1000;

export async function reviewDeliveryEvidence(
  input: ReviewDeliveryEvidenceInput,
) {
  const reviewNote = input.reviewNote?.trim() || null;

  if (input.decision !== "ACCEPT" && input.decision !== "REJECT") {
    throw new ApiError(
      400,
      "Decision must be ACCEPT or REJECT",
      "INVALID_REVIEW_DECISION",
    );
  }

  if (input.decision === "REJECT" && !reviewNote) {
    throw new ApiError(
      400,
      "A review note is required when rejecting evidence",
      "REVIEW_NOTE_REQUIRED",
    );
  }

  return prisma.$transaction(async (tx) => {
    const evidenceOrder = await tx.deliveryEvidence.findUnique({
      where: { id: input.evidenceId },
      select: { orderId: true },
    });

    if (!evidenceOrder) {
      throw new ApiError(
        404,
        "Delivery evidence not found",
        "DELIVERY_EVIDENCE_NOT_FOUND",
      );
    }

    await tx.$queryRaw<{ id: string }[]>`
  SELECT "id"
  FROM "Order"
  WHERE "id" = ${evidenceOrder.orderId}
  FOR UPDATE
`;

    const evidence = await tx.deliveryEvidence.findUnique({
      where: { id: input.evidenceId },
      include: {
        order: {
          include: {
            escrow: true,
            dispute: {
              select: { status: true },
            },
          },
        },
      },
    });

    if (!evidence) {
      throw new ApiError(
        404,
        "Delivery evidence not found",
        "DELIVERY_EVIDENCE_NOT_FOUND",
      );
    }

    if (evidence.status !== DeliveryEvidenceStatus.PENDING_REVIEW) {
      throw new ApiError(
        409,
        "This delivery evidence has already been reviewed",
        "EVIDENCE_ALREADY_REVIEWED",
      );
    }

    const order = evidence.order;

    if (order.status !== OrderStatus.IN_DELIVERY) {
      throw new ApiError(
        409,
        "Evidence can only be reviewed for an order in delivery",
        "ORDER_NOT_IN_DELIVERY",
      );
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new ApiError(
        409,
        "Evidence can only be reviewed for a paid order",
        "ORDER_NOT_PAID",
      );
    }

    if (!order.escrow || order.escrow.status !== EscrowStatus.HELD) {
      throw new ApiError(
        409,
        "The order does not have an escrow currently held",
        "ESCROW_NOT_HELD",
      );
    }

    const now = new Date();

    // Rejection does not change the order or escrow.
    if (input.decision === "REJECT") {
      const updated = await tx.deliveryEvidence.updateMany({
        where: {
          id: evidence.id,
          status: DeliveryEvidenceStatus.PENDING_REVIEW,
        },
        data: {
          status: DeliveryEvidenceStatus.REJECTED,
          reviewedAt: now,
          reviewedById: input.adminId,
          reviewNote,
        },
      });

      if (updated.count !== 1) {
        throw new ApiError(
          409,
          "This evidence was reviewed by another administrator",
          "EVIDENCE_REVIEW_CONFLICT",
        );
      }

      return tx.deliveryEvidence.findUniqueOrThrow({
        where: { id: evidence.id },
      });
    }

    const hasActiveDispute =
      order.dispute !== null &&
      (order.dispute.status === DisputeStatus.OPEN ||
        order.dispute.status === DisputeStatus.UNDER_REVIEW);

    if (hasActiveDispute) {
      throw new ApiError(
        409,
        "Resolve the active dispute before accepting delivery evidence",
        "ACTIVE_DISPUTE_EXISTS",
      );
    }

    const buyerResponseDeadline = new Date(
      now.getTime() + BUYER_RESPONSE_WINDOW_MS,
    );

    // First claim the pending evidence so competing reviews cannot
    // both succeed. Any later failure rolls this change back.
    const updatedEvidence = await tx.deliveryEvidence.updateMany({
      where: {
        id: evidence.id,
        status: DeliveryEvidenceStatus.PENDING_REVIEW,
      },
      data: {
        status: DeliveryEvidenceStatus.ACCEPTED,
        reviewedAt: now,
        reviewedById: input.adminId,
        reviewNote,
        buyerNotifiedAt: now,
        buyerResponseDeadline,
      },
    });

    if (updatedEvidence.count !== 1) {
      throw new ApiError(
        409,
        "This evidence was reviewed by another administrator",
        "EVIDENCE_REVIEW_CONFLICT",
      );
    }

    const updatedOrder = await tx.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.IN_DELIVERY,
        paymentStatus: PaymentStatus.PAID,
      },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: now,
      },
    });

    if (updatedOrder.count !== 1) {
      throw new ApiError(
        409,
        "The order changed while the evidence was being reviewed",
        "ORDER_REVIEW_CONFLICT",
      );
    }

    const updatedEscrow = await tx.escrow.updateMany({
      where: {
        id: order.escrow.id,
        status: EscrowStatus.HELD,
      },
      data: {
        releaseEligibleAt: buyerResponseDeadline,
      },
    });

    if (updatedEscrow.count !== 1) {
      throw new ApiError(
        409,
        "The escrow changed while the evidence was being reviewed",
        "ESCROW_REVIEW_CONFLICT",
      );
    }

    await tx.orderTracking.create({
      data: {
        orderId: order.id,
        status: OrderStatus.DELIVERED,
        note:
          "ROA admin accepted seller delivery evidence. " +
          "The buyer has 36 hours to confirm delivery or report an issue. " +
          "Escrow remains held during this process.",
      },
    });

    // Persist the buyer notification in the same transaction.
    // External Telegram/WhatsApp delivery can be processed separately.
    const notification = await tx.notification.create({
      data: {
        recipientId: order.userId,
        type: "DELIVERY_EVIDENCE_ACCEPTED",
        title: "Delivery evidence reviewed",
        message:
          `ROA has accepted the seller's delivery evidence for order ` +
          `${order.orderNumber}. Please confirm receipt or report an issue ` +
          `within 36 hours.`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          evidenceId: evidence.id,
          buyerResponseDeadline: buyerResponseDeadline.toISOString(),
        } satisfies Prisma.InputJsonObject,
        dedupeKey: `delivery-evidence-accepted:${evidence.id}`,
      },
    });

    await tx.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationDeliveryStatus.PENDING,
      },
    });

    return tx.deliveryEvidence.findUniqueOrThrow({
      where: { id: evidence.id },
    });
  });
}
