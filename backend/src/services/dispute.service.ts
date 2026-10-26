import {
  Prisma,
  DisputeStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const ORDER_LEVEL_DELIVERY_REASONS = ["NON_DELIVERY"] as const;

type DisputedOrderItemInput = {
  orderItemId: string;
  quantity: number;
};

export type OpenDisputeInput = {
  orderId: string;
  buyerId: string;
  reason:
    | "WRONG_ITEM"
    | "DAMAGED"
    | "DEFECTIVE"
    | "NOT_AS_DESCRIBED"
    | "MISSING_ITEM"
    | "QUALITY_ISSUE"
    | "DELIVERY_ISSUE"
    | "NON_DELIVERY"
    | "OTHER";
  description: string;
  items?: DisputedOrderItemInput[];
  evidence?: Prisma.InputJsonValue;
};

export async function openDispute(input: OpenDisputeInput) {
  const description = input.description.trim();
  const orderId = input.orderId.trim();
  const buyerId = input.buyerId.trim();

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  if (!buyerId) {
    throw new ApiError(400, "Buyer ID is required");
  }

  if (!description) {
    throw new ApiError(400, "Dispute description is required");
  }

  if (description.length < 10) {
    throw new ApiError(
      400,
      "Please provide at least 10 characters describing the issue",
    );
  }

  if (description.length > 5000) {
    throw new ApiError(
      400,
      "Dispute description cannot exceed 5000 characters",
    );
  }

  const requestedItems = (input.items ?? []).map((item) => ({
    orderItemId: item.orderItemId.trim(),
    quantity: item.quantity,
  }));

  const isOrderLevelDeliveryDispute = ORDER_LEVEL_DELIVERY_REASONS.includes(
    input.reason as (typeof ORDER_LEVEL_DELIVERY_REASONS)[number],
  );

  if (isOrderLevelDeliveryDispute && requestedItems.length > 0) {
    throw new ApiError(
      400,
      "Non-delivery disputes automatically include all order items; do not submit items manually",
    );
  }

  if (!isOrderLevelDeliveryDispute && requestedItems.length === 0) {
    throw new ApiError(
      400,
      "Select at least one affected product for this dispute",
    );
  }

  const itemIds = requestedItems.map((item) => item.orderItemId);

  if (itemIds.some((id) => !id)) {
    throw new ApiError(400, "Every disputed product must have a valid item ID");
  }

  if (new Set(itemIds).size !== itemIds.length) {
    throw new ApiError(
      400,
      "A product can only appear once in the disputed items list",
    );
  }

  for (const item of requestedItems) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new ApiError(
        400,
        "Each disputed quantity must be a positive whole number",
      );
    }
  }

  return prisma.$transaction(
    async (tx) => {
      /*
       * Lock order first.
       *
       * Delivery confirmation, delivery-evidence review, dispute
       * opening, dispute resolution, and escrow release must use a
       * compatible lock order to reduce deadlock risk.
       */
      const lockedOrders = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Order"
        WHERE "id" = ${orderId}
        FOR UPDATE
      `;

      if (lockedOrders.length !== 1) {
        throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
      }

      /*
       * Read the order only after acquiring its row lock so the
       * mutable order state is checked against the serialized workflow.
       */
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          userId: true,
          status: true,
          paymentStatus: true,
          store: {
            select: {
              ownerId: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              status: true,
            },
          },
          escrow: {
            select: {
              id: true,
              orderId: true,
              buyerId: true,
              sellerId: true,
              status: true,
              releaseEligibleAt: true,
            },
          },
        },
      });

      if (!order) {
        throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
      }

      if (order.userId !== buyerId) {
        throw new ApiError(403, "You are not authorized to dispute this order");
      }

      if (!order.store.ownerId) {
        throw new ApiError(409, "This order has no valid store owner");
      }

      if (!order.escrow) {
        throw new ApiError(409, "This order has no escrow record");
      }

      /*
       * Verify the relationship before using the escrow ID to lock it.
       */
      const initialEscrow = order.escrow;

      if (
        initialEscrow.orderId !== order.id ||
        initialEscrow.buyerId !== order.userId ||
        initialEscrow.sellerId !== order.store.ownerId
      ) {
        throw new ApiError(
          409,
          "Order and escrow ownership details do not match",
          "DISPUTE_FINANCIAL_RECORD_MISMATCH",
        );
      }

      /*
       * Lock escrow second, after Order.
       */
      const lockedEscrows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Escrow"
        WHERE "id" = ${initialEscrow.id}
        FOR UPDATE
      `;

      if (lockedEscrows.length !== 1) {
        throw new ApiError(
          409,
          "The order escrow no longer exists",
          "DISPUTE_ESCROW_NOT_FOUND",
        );
      }

      /*
       * Re-read escrow after acquiring its lock. Use this fresh
       * record for status checks and the conditional state transition.
       */
      const escrow = await tx.escrow.findUnique({
        where: {
          id: initialEscrow.id,
        },
        select: {
          id: true,
          orderId: true,
          buyerId: true,
          sellerId: true,
          status: true,
          releaseEligibleAt: true,
        },
      });

      if (!escrow) {
        throw new ApiError(
          409,
          "The order escrow no longer exists",
          "DISPUTE_ESCROW_NOT_FOUND",
        );
      }

      if (
        escrow.orderId !== order.id ||
        escrow.buyerId !== order.userId ||
        escrow.sellerId !== order.store.ownerId
      ) {
        throw new ApiError(
          409,
          "Order and escrow ownership details do not match",
          "DISPUTE_FINANCIAL_RECORD_MISMATCH",
        );
      }

      if (
        input.reason === "NON_DELIVERY" &&
        order.items.some((item) => item.status !== "ACTIVE")
      ) {
        throw new ApiError(
          409,
          "This order contains items that are not eligible for a non-delivery refund",
        );
      }

      const itemsToCreate =
        input.reason === "NON_DELIVERY"
          ? order.items.map((item) => ({
              orderItemId: item.id,
              quantity: item.quantity,
            }))
          : requestedItems;

      if (order.paymentStatus !== "PAID") {
        throw new ApiError(409, "Only paid orders can be disputed");
      }

      const now = new Date();

      /*
       * Non-delivery must be reported while the order is still
       * IN_DELIVERY. A cancelled order must use the appropriate
       * cancellation/refund workflow instead.
       */
      if (input.reason === "NON_DELIVERY") {
        if (order.status !== "IN_DELIVERY") {
          throw new ApiError(
            409,
            "A non-delivery dispute can only be opened while the order is in delivery",
          );
        }
      } else if (input.reason === "DELIVERY_ISSUE") {
        /*
         * A delivery issue may be reported during delivery or
         * within the inspection window after delivery.
         */
        if (order.status !== "IN_DELIVERY" && order.status !== "DELIVERED") {
          throw new ApiError(
            409,
            "A delivery issue can only be disputed during delivery or within the post-delivery inspection window",
          );
        }
      } else if (order.status !== "DELIVERED") {
        /*
         * Product-condition claims require receipt of the order.
         */
        throw new ApiError(
          409,
          "Product disputes can only be opened after delivery has been confirmed",
        );
      }

      /*
       * Product disputes and delivered-order delivery issues must
       * be opened before the original 36-hour deadline.
       * Never extend or restart this deadline when a dispute opens.
       */
      if (order.status === "DELIVERED") {
        if (!escrow.releaseEligibleAt) {
          throw new ApiError(
            409,
            "The delivery inspection deadline has not been established",
          );
        }

        if (now.getTime() >= escrow.releaseEligibleAt.getTime()) {
          throw new ApiError(
            409,
            "The 36-hour dispute window has expired",
            "DISPUTE_WINDOW_EXPIRED",
          );
        }
      }

      /*
       * Confirm every claimed item belongs to this order, is still
       * active, and has enough units to cover the claimed quantity.
       */
      const orderItemsById = new Map(
        order.items.map((item) => [item.id, item]),
      );

      for (const requestedItem of requestedItems) {
        const orderItem = orderItemsById.get(requestedItem.orderItemId);

        if (!orderItem || orderItem.status !== "ACTIVE") {
          throw new ApiError(
            400,
            "One or more disputed products do not belong to this order or are no longer active",
          );
        }

        if (requestedItem.quantity > orderItem.quantity) {
          throw new ApiError(
            400,
            "A disputed quantity cannot exceed the quantity purchased",
          );
        }
      }

      /*
       * One dispute per order, regardless of the existing dispute's
       * status. The Order lock serializes compliant dispute-opening
       * requests; the unique orderId constraint remains the final
       * database-level safeguard.
       */
      const existingDispute = await tx.dispute.findUnique({
        where: {
          orderId: order.id,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (existingDispute) {
        throw new ApiError(
          409,
          "A dispute has already been opened for this order. Multiple disputes or additional refund claims for the same order are not allowed.",
          "ORDER_DISPUTE_ALREADY_EXISTS",
        );
      }

      if (escrow.status !== "HELD") {
        if (escrow.status === "DISPUTED") {
          throw new ApiError(
            409,
            "This escrow is already disputed or requires administrative review",
          );
        }

        throw new ApiError(
          409,
          "This order's escrow is not available for a new dispute",
        );
      }

      /*
       * Claim escrow before creating the dispute.
       * The conditional transition is an additional safeguard if
       * another workflow changes escrow state unexpectedly.
       */
      const escrowClaim = await tx.escrow.updateMany({
        where: {
          id: escrow.id,
          orderId: order.id,
          buyerId,
          status: "HELD",
        },
        data: {
          status: "DISPUTED",
        },
      });

      if (escrowClaim.count !== 1) {
        throw new ApiError(
          409,
          "The escrow state changed. Please refresh the order and try again",
          "DISPUTE_ESCROW_STATE_CHANGED",
        );
      }

      const dispute = await tx.dispute.create({
        data: {
          orderId: order.id,
          escrowId: escrow.id,
          buyerId,
          sellerId: escrow.sellerId,
          reason: input.reason,
          description,
          ...(input.evidence !== undefined ? { evidence: input.evidence } : {}),
          ...(itemsToCreate.length > 0
            ? {
                items: {
                  create: itemsToCreate.map((item) => ({
                    orderItemId: item.orderItemId,
                    claimedQuantity: item.quantity,
                  })),
                },
              }
            : {}),
        },
        select: {
          id: true,
          orderId: true,
          escrowId: true,
          buyerId: true,
          sellerId: true,
          reason: true,
          status: true,
          description: true,
          evidence: true,
          items: {
            select: {
              id: true,
              orderItemId: true,
              claimedQuantity: true,
              approvedQuantity: true,
              outcome: true,
              calculatedRefundAmount: true,
            },
          },
          createdAt: true,
        },
      });

      return {
        message:
          "Dispute opened successfully. The escrow funds remain protected.",
        dispute,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 10_000,
      timeout: 15_000,
    },
  );
}

type SubmitSellerDisputeResponseInput = {
  disputeId: string;
  sellerId: string;
  response: string;
};

export async function submitSellerDisputeResponse(
  input: SubmitSellerDisputeResponseInput,
) {
  const disputeId = input.disputeId.trim();
  const sellerId = input.sellerId.trim();
  const response = input.response.trim();

  if (!disputeId || !sellerId) {
    throw new ApiError(400, "Dispute ID and seller ID are required");
  }

  if (!response) {
    throw new ApiError(400, "Seller response is required");
  }

  if (response.length < 10) {
    throw new ApiError(
      400,
      "Seller response must contain at least 10 characters",
    );
  }

  if (response.length > 5000) {
    throw new ApiError(400, "Seller response cannot exceed 5000 characters");
  }

  return prisma.$transaction(
    async (tx) => {
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
        throw new ApiError(404, "Dispute not found");
      }

      if (
        dispute.sellerId !== sellerId ||
        dispute.order.store.ownerId !== sellerId
      ) {
        throw new ApiError(
          403,
          "You are not authorized to respond to this dispute",
        );
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.UNDER_REVIEW
      ) {
        throw new ApiError(
          409,
          "This dispute is no longer accepting seller responses",
        );
      }

      if (dispute.sellerResponse !== null) {
        throw new ApiError(409, "A seller response has already been submitted");
      }

      /*
       * Atomically claim the response slot so concurrent submissions
       * cannot overwrite one another or create duplicate notifications.
       */
      const updated = await tx.dispute.updateMany({
        where: {
          id: dispute.id,
          sellerId,
          status: {
            in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW],
          },
          sellerResponse: null,
        },
        data: {
          sellerResponse: response,
        },
      });

      if (updated.count !== 1) {
        throw new ApiError(
          409,
          "The dispute changed or a seller response was already submitted",
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
          dedupeKey: `dispute-seller-response:${dispute.id}`,
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
          buyerId: true,
          reason: true,
          status: true,
          description: true,
          sellerResponse: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },
    {
      maxWait: 10_000,
      timeout: 15_000,
    },
  );
}
