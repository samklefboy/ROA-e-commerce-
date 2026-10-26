import {
  DisputeItemOutcome,
  DisputeResolutionOutcome,
  DisputeStatus,
  Prisma,
} from "../../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { calculateDisputeRefund } from "../refund-calculation.service.js";
import { releaseOrderStock } from "../order-stock.service.js";

type ItemDecision = {
  disputeItemId: string;
  outcome: DisputeItemOutcome;
  approvedQuantity: number;
};

type ResolveDisputeInput = {
  disputeId: string;
  adminId: string;
  outcome: DisputeResolutionOutcome;
  resolutionNote: string;
  itemDecisions?: ItemDecision[];
};

const ZERO = new Prisma.Decimal(0);

function money(value: Prisma.Decimal | string | number): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function moneyString(value: Prisma.Decimal | string | number): string {
  return money(value).toFixed(2);
}

async function createResolutionNotification(
  tx: Prisma.TransactionClient,
  input: {
    recipientId: string;
    disputeId: string;
    orderId: string;
    outcome: DisputeResolutionOutcome;
    refundAmount: string;
    title: string;
    message: string;
    audience: "buyer" | "seller";
  },
): Promise<void> {
  await tx.notification.create({
    data: {
      recipientId: input.recipientId,
      type: "DISPUTE_RESOLVED",
      title: input.title,
      message: input.message,
      dedupeKey: `dispute-resolution:${input.disputeId}:${input.audience}`,
      data: {
        disputeId: input.disputeId,
        orderId: input.orderId,
        resolutionOutcome: input.outcome,
        refundAmount: input.refundAmount,
        currency: "NGN",
      },
      deliveries: {
        create: {
          channel: "IN_APP",
          status: "PENDING",
        },
      },
    },
  });
}

export async function resolveDispute(input: ResolveDisputeInput) {
  const disputeId = input.disputeId?.trim();
  const adminId = input.adminId?.trim();
  const resolutionNote = input.resolutionNote?.trim();

  if (!disputeId || !adminId) {
    throw new ApiError(
      400,
      "Dispute ID and admin ID are required",
      "DISPUTE_RESOLUTION_INPUT_INVALID",
    );
  }

  if (!resolutionNote || resolutionNote.length < 5) {
    throw new ApiError(
      400,
      "A resolution note of at least 5 characters is required",
      "DISPUTE_RESOLUTION_NOTE_REQUIRED",
    );
  }

  if (resolutionNote.length > 5000) {
    throw new ApiError(
      400,
      "Resolution note cannot exceed 5000 characters",
      "DISPUTE_RESOLUTION_NOTE_TOO_LONG",
    );
  }

  const itemDecisions = (input.itemDecisions ?? []).map((decision) => ({
    ...decision,
    disputeItemId: decision.disputeItemId?.trim() ?? "",
  }));

  const seenDecisionIds = new Set<string>();

  for (const decision of itemDecisions) {
    if (!decision.disputeItemId) {
      throw new ApiError(
        400,
        "Every item decision must include a dispute item ID",
        "DISPUTE_ITEM_DECISION_INVALID",
      );
    }

    if (seenDecisionIds.has(decision.disputeItemId)) {
      throw new ApiError(
        400,
        "Duplicate dispute item decisions are not allowed",
        "DUPLICATE_DISPUTE_ITEM_DECISION",
      );
    }

    seenDecisionIds.add(decision.disputeItemId);

    if (
      !Number.isSafeInteger(decision.approvedQuantity) ||
      decision.approvedQuantity < 0
    ) {
      throw new ApiError(
        400,
        "Approved quantities must be non-negative whole numbers",
        "DISPUTE_APPROVED_QUANTITY_INVALID",
      );
    }
  }

  return prisma.$transaction(
    async (tx) => {
      /*
       * LOCK ORDER:
       * 1. Order
       * 2. Dispute
       * 3. Escrow
       * 4. Buyer wallet, if a refund is due
       *
       * Read the order ID first without locking so we can acquire the
       * Order lock before the Dispute lock. The order relationship must
       * be verified again after acquiring the locks.
       */
      const disputeLocator = await tx.dispute.findUnique({
        where: { id: disputeId },
        select: { orderId: true },
      });

      if (!disputeLocator) {
        throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
      }

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

      const lockedDisputes = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Dispute"
        WHERE "id" = ${disputeId}
        FOR UPDATE
      `;

      if (lockedDisputes.length !== 1) {
        throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
      }

      const initialDispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        select: {
          orderId: true,
          escrowId: true,
        },
      });

      if (!initialDispute) {
        throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
      }

      if (initialDispute.orderId !== disputeLocator.orderId) {
        throw new ApiError(
          409,
          "The dispute's order association changed unexpectedly",
          "DISPUTE_ORDER_MISMATCH",
        );
      }

      const lockedEscrows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Escrow"
        WHERE "id" = ${initialDispute.escrowId}
        FOR UPDATE
      `;

      if (lockedEscrows.length !== 1) {
        throw new ApiError(
          409,
          "The escrow associated with this dispute was not found",
          "DISPUTE_ESCROW_NOT_FOUND",
        );
      }

      /*
       * Reload the financial records only after all three primary locks
       * have been acquired. Do not use pre-lock balances or statuses.
       */
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: {
          order: {
            include: {
              items: true,
              store: {
                select: {
                  ownerId: true,
                },
              },
            },
          },
          escrow: true,
          items: {
            include: {
              orderItem: true,
            },
          },
        },
      });

      if (!dispute) {
        throw new ApiError(404, "Dispute not found", "DISPUTE_NOT_FOUND");
      }

      if (
        dispute.orderId !== initialDispute.orderId ||
        dispute.escrowId !== initialDispute.escrowId
      ) {
        throw new ApiError(
          409,
          "Dispute financial associations changed unexpectedly",
          "DISPUTE_FINANCIAL_RECORD_MISMATCH",
        );
      }

      if (dispute.status !== DisputeStatus.UNDER_REVIEW) {
        throw new ApiError(
          409,
          "Only disputes currently under admin review can be resolved",
          "DISPUTE_NOT_UNDER_REVIEW",
        );
      }

      if (dispute.escrow.status !== "DISPUTED") {
        throw new ApiError(
          409,
          "The dispute escrow is not in the expected disputed state",
          "DISPUTE_ESCROW_STATE_INVALID",
        );
      }

      if (
        dispute.escrow.orderId !== dispute.orderId ||
        dispute.escrow.buyerId !== dispute.buyerId ||
        dispute.escrow.sellerId !== dispute.sellerId ||
        dispute.order.userId !== dispute.buyerId || // NEW CHECK
        dispute.order.store.ownerId !== dispute.sellerId
      ) {
        throw new ApiError(
          409,
          "Dispute, order, escrow, and seller records do not match",
          "DISPUTE_FINANCIAL_RECORD_MISMATCH",
        );
      }

      if (!money(dispute.escrow.amount).equals(money(dispute.order.total))) {
        throw new ApiError(
          409,
          "Original escrow amount does not match the order total",
          "ESCROW_AMOUNT_MISMATCH",
        );
      }

      if (
        (dispute.order.paymentStatus !== "PAID" &&
          dispute.order.paymentStatus !== "PARTIALLY_REFUNDED") ||
        dispute.escrow.releasedAt !== null
      ) {
        throw new ApiError(
          409,
          "This dispute is not eligible for escrow-funded resolution",
          "DISPUTE_ESCROW_NOT_REFUNDABLE",
        );
      }

      if (
        input.outcome ===
          DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY &&
        (dispute.reason !== "NON_DELIVERY" ||
          dispute.order.status !== "IN_DELIVERY")
      ) {
        throw new ApiError(
          409,
          "A seller-responsible non-delivery outcome requires a non-delivery dispute on an outstanding delivery",
          "NON_DELIVERY_RESOLUTION_NOT_ALLOWED",
        );
      }

      if (
        input.outcome === DisputeResolutionOutcome.PRODUCT_COMPENSATION &&
        (dispute.order.status !== "DELIVERED" ||
          dispute.reason === "NON_DELIVERY")
      ) {
        throw new ApiError(
          409,
          "Product compensation requires a delivered order and a product-related dispute",
          "PRODUCT_COMPENSATION_NOT_ALLOWED",
        );
      }

      if (dispute.buyerId === dispute.sellerId) {
        throw new ApiError(
          409,
          "Buyer and seller cannot be the same account",
          "DISPUTE_PARTIES_INVALID",
        );
      }

      const orderItems = dispute.order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        status: item.status,
      }));

      const persistedDisputeItems = dispute.items.map((item) => ({
        id: item.id,
        orderItemId: item.orderItemId,
        claimedQuantity: item.claimedQuantity,
        approvedQuantity: item.approvedQuantity,
        outcome: item.outcome,
      }));

      const persistedItemsById = new Map(
        persistedDisputeItems.map((item) => [item.id, item]),
      );

      for (const decision of itemDecisions) {
        const claimedItem = persistedItemsById.get(decision.disputeItemId);

        if (!claimedItem) {
          throw new ApiError(
            400,
            "An item decision does not belong to this dispute",
            "DISPUTE_ITEM_DECISION_MISMATCH",
          );
        }

        if (decision.approvedQuantity > claimedItem.claimedQuantity) {
          throw new ApiError(
            400,
            "Approved quantity cannot exceed the buyer's claimed quantity",
            "DISPUTE_APPROVED_QUANTITY_EXCEEDS_CLAIM",
          );
        }

        if (
          decision.outcome === DisputeItemOutcome.REJECTED &&
          decision.approvedQuantity !== 0
        ) {
          throw new ApiError(
            400,
            "Rejected claims must have an approved quantity of zero",
            "DISPUTE_REJECTED_QUANTITY_INVALID",
          );
        }

        if (
          decision.outcome !== DisputeItemOutcome.REJECTED &&
          decision.approvedQuantity === 0
        ) {
          throw new ApiError(
            400,
            "Claims approved for compensation must have a positive approved quantity",
            "DISPUTE_APPROVED_QUANTITY_REQUIRED",
          );
        }
      }

      let calculatorItems = persistedDisputeItems;

      if (input.outcome === DisputeResolutionOutcome.REJECTED) {
        calculatorItems = persistedDisputeItems.map((item) => ({
          ...item,
          approvedQuantity: 0,
          outcome: DisputeItemOutcome.REJECTED,
        }));
      } else if (
        input.outcome === DisputeResolutionOutcome.PRODUCT_COMPENSATION
      ) {
        if (itemDecisions.length !== persistedDisputeItems.length) {
          throw new ApiError(
            400,
            "Provide a verified outcome and approved quantity for every disputed item",
            "DISPUTE_ITEM_DECISIONS_INCOMPLETE",
          );
        }

        const decisionsById = new Map(
          itemDecisions.map((decision) => [decision.disputeItemId, decision]),
        );

        calculatorItems = persistedDisputeItems.map((item) => {
          const decision = decisionsById.get(item.id);

          if (!decision) {
            throw new ApiError(
              400,
              "A disputed item is missing its resolution decision",
              "DISPUTE_ITEM_DECISIONS_INCOMPLETE",
            );
          }

          return {
            ...item,
            outcome: decision.outcome,
            approvedQuantity: decision.approvedQuantity,
          };
        });
      } else if (
        input.outcome ===
        DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY
      ) {
        if (orderItems.some((item) => item.status !== "ACTIVE")) {
          throw new ApiError(
            409,
            "Non-delivery refund requires every order item to remain active",
            "NON_DELIVERY_ORDER_ITEMS_INVALID",
          );
        }

        // NEW CHECK: every order item must be claimed at its full quantity.
        const disputeItemsByOrderItemId = new Map(
          persistedDisputeItems.map((item) => [item.orderItemId, item]),
        );

        const hasCompleteNonDeliveryClaims = orderItems.every((item) => {
          const claim = disputeItemsByOrderItemId.get(item.id);

          return claim !== undefined && claim.claimedQuantity === item.quantity;
        });

        if (
          persistedDisputeItems.length !== orderItems.length ||
          !hasCompleteNonDeliveryClaims
        ) {
          throw new ApiError(
            409,
            "Non-delivery resolution requires a dispute record for every order item and its full purchased quantity",
            "NON_DELIVERY_ITEMS_INCOMPLETE",
          );
        }
      }

      /*
       * Completed refund records are the source of truth for cumulative
       * refunds. The escrow row is locked, preventing concurrent financial
       * resolutions from spending the same escrow funds.
       */
      const completedRefunds = await tx.refund.aggregate({
        where: {
          escrowId: dispute.escrowId,
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      });

      const alreadyRefunded = money(completedRefunds._sum.amount ?? ZERO);
      const recordedEscrowRefunds = money(
        dispute.escrow.refundedAmount ?? ZERO,
      );

      if (!recordedEscrowRefunds.equals(alreadyRefunded)) {
        throw new ApiError(
          409,
          "Escrow refund totals do not match completed refund records",
          "ESCROW_REFUND_TOTAL_MISMATCH",
        );
      }

      const calculation = calculateDisputeRefund({
        resolutionOutcome: input.outcome,
        orderSubtotal: dispute.order.subtotal,
        orderDiscount: dispute.order.discount,
        deliveryFee: dispute.order.deliveryFee,
        orderTotal: dispute.order.total,
        escrowAmount: dispute.escrow.amount,
        alreadyRefundedAmount: alreadyRefunded,
        orderItems,
        disputeItems: calculatorItems,
      });

      const refundAmount = money(calculation.totalRefundAmount);
      const cumulativeRefunds = money(alreadyRefunded.plus(refundAmount));
      const remainingEscrow = money(
        dispute.escrow.amount.minus(cumulativeRefunds),
      );

      if (
        refundAmount.lessThan(ZERO) ||
        cumulativeRefunds.greaterThan(money(dispute.escrow.amount)) ||
        remainingEscrow.lessThan(ZERO)
      ) {
        throw new ApiError(
          409,
          "The calculated refund exceeds the remaining escrow funds",
          "REFUND_EXCEEDS_ESCROW",
        );
      }

      /*
       * Credit only the calculator-approved refund. The wallet lock comes
       * after the Order, Dispute, and Escrow locks.
       */
      let refundId: string | null = null;

      if (refundAmount.greaterThan(ZERO)) {
        const buyerWalletLocator = await tx.wallet.findUnique({
          where: { userId: dispute.buyerId },
          select: { id: true },
        });

        if (!buyerWalletLocator) {
          throw new ApiError(
            409,
            "The buyer does not have a wallet for this refund",
            "BUYER_WALLET_UNAVAILABLE",
          );
        }

        const lockedWallets = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Wallet"
          WHERE "id" = ${buyerWalletLocator.id}
          FOR UPDATE
        `;

        if (lockedWallets.length !== 1) {
          throw new ApiError(
            409,
            "The buyer wallet is no longer available",
            "BUYER_WALLET_UNAVAILABLE",
          );
        }

        const lockedWallet = await tx.wallet.findUnique({
          where: { id: buyerWalletLocator.id },
        });

        if (!lockedWallet || !lockedWallet.isActive) {
          throw new ApiError(
            409,
            "The buyer does not have an active wallet for this refund",
            "BUYER_WALLET_UNAVAILABLE",
          );
        }

        if (lockedWallet.currency !== dispute.escrow.currency) {
          throw new ApiError(
            409,
            "Buyer wallet currency does not match the escrow currency",
            "REFUND_CURRENCY_MISMATCH",
          );
        }

        const heldBefore = money(lockedWallet.heldBalance);
        const availableBefore = money(lockedWallet.availableBalance);

        if (heldBefore.lessThan(refundAmount)) {
          throw new ApiError(
            409,
            "Buyer held funds are insufficient to cover the calculated refund",
            "REFUND_HELD_BALANCE_INSUFFICIENT",
          );
        }

        const idempotencyKey = `dispute:${dispute.id}:resolution-refund`;

        const existingRefund = await tx.refund.findUnique({
          where: { idempotencyKey },
        });

        if (existingRefund) {
          throw new ApiError(
            409,
            "A refund record already exists for this dispute resolution",
            "DISPUTE_REFUND_ALREADY_EXISTS",
          );
        }

        const refund = await tx.refund.create({
          data: {
            orderId: dispute.orderId,
            escrowId: dispute.escrowId,
            userId: dispute.buyerId,
            type: calculation.refundType === "FULL" ? "FULL" : "PARTIAL",
            status: "COMPLETED",
            amount: refundAmount,
            currency: dispute.escrow.currency,
            reason: `Admin dispute resolution: ${dispute.id}`,
            idempotencyKey,
            processedAt: new Date(),
            metadata: {
              disputeId: dispute.id,
              resolutionOutcome: input.outcome,
              productRefundAmount: calculation.productRefundAmount,
              deliveryFeeRefundAmount: calculation.deliveryFeeRefundAmount,
              items: calculation.items.map((item) => ({
                disputeItemId: item.disputeItemId,
                orderItemId: item.orderItemId,
                approvedQuantity: item.approvedQuantity,
                outcome: item.outcome,
                rateBps: item.rateBps,
                amount: item.amount,
              })),
            },
          },
        });

        refundId = refund.id;

        const walletUpdate = await tx.wallet.updateMany({
          where: {
            id: lockedWallet.id,
            isActive: true,
            heldBalance: { gte: refundAmount },
          },
          data: {
            heldBalance: { decrement: refundAmount },
            availableBalance: { increment: refundAmount },
          },
        });

        if (walletUpdate.count !== 1) {
          throw new ApiError(
            409,
            "Buyer held balance changed before the refund could be applied",
            "REFUND_WALLET_BALANCE_CHANGED",
          );
        }

        const availableAfter = money(availableBefore.plus(refundAmount));
        const heldAfter = money(heldBefore.minus(refundAmount));

        const ledger = await tx.walletLedger.create({
          data: {
            walletId: lockedWallet.id,
            type: "REFUND",
            status: "COMPLETED",
            amount: refundAmount,
            currency: dispute.escrow.currency,
            availableBalanceBefore: availableBefore,
            availableBalanceAfter: availableAfter,
            heldBalanceBefore: heldBefore,
            heldBalanceAfter: heldAfter,
            orderId: dispute.orderId,
            escrowId: dispute.escrowId,
            refundId: refund.id,
            reference: `DISPUTE-REFUND-${dispute.id}`,
            idempotencyKey: `dispute:${dispute.id}:resolution-refund-ledger`,
            description: `Buyer refund for dispute ${dispute.id}`,
            metadata: {
              disputeId: dispute.id,
              adminId,
              resolutionOutcome: input.outcome,
            },
          },
        });

        await tx.refund.update({
          where: { id: refund.id },
          data: { walletLedgerId: ledger.id },
        });
      }

      /*
       * Persist each calculated item decision, including zero-refund
       * decisions. No amount is accepted from the admin as an input.
       */
      for (const item of calculation.items) {
        if (!item.disputeItemId) {
          continue;
        }

        await tx.disputeItem.update({
          where: { id: item.disputeItemId },
          data: {
            outcome: item.outcome,
            approvedQuantity: item.approvedQuantity,
            calculatedRefundAmount: money(item.amount),
          },
        });
      }

      let nextEscrowStatus: "HELD" | "PARTIALLY_REFUNDED" | "REFUNDED";

      if (remainingEscrow.isZero()) {
        nextEscrowStatus = "REFUNDED";
      } else if (cumulativeRefunds.greaterThan(ZERO)) {
        nextEscrowStatus = "PARTIALLY_REFUNDED";
      } else {
        // No refund was approved, so escrow can return to HELD.
        nextEscrowStatus = "HELD";
      }

      const escrowUpdate = await tx.escrow.updateMany({
        where: {
          id: dispute.escrowId,
          orderId: dispute.orderId,
          status: "DISPUTED",
          releasedAt: null,
        },
        data: {
          status: nextEscrowStatus,
          refundedAmount: cumulativeRefunds,
          refundedAt: remainingEscrow.isZero() ? new Date() : null,
          refundReason: refundAmount.greaterThan(ZERO)
            ? `Dispute resolution: ${dispute.id}`
            : dispute.escrow.refundReason,
        },
      });

      if (escrowUpdate.count !== 1) {
        throw new ApiError(
          409,
          "Escrow state changed before dispute resolution could be completed",
          "DISPUTE_ESCROW_STATE_CHANGED",
        );
      }

      let nextPaymentStatus: "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" =
        "PAID";

      if (cumulativeRefunds.greaterThan(ZERO)) {
        nextPaymentStatus = cumulativeRefunds.greaterThanOrEqualTo(
          dispute.escrow.amount,
        )
          ? "REFUNDED"
          : "PARTIALLY_REFUNDED";
      }

      if (
        input.outcome ===
        DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY
      ) {
        await releaseOrderStock(
          tx,
          dispute.order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variant: item.variant,
          })),
        );
      }

      const orderUpdate = await tx.order.updateMany({
        where: {
          id: dispute.orderId,
          paymentStatus: dispute.order.paymentStatus,
        },
        data: {
          paymentStatus: nextPaymentStatus,
          ...(input.outcome ===
          DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY
            ? {
                status: "CANCELLED" as const,
                cancellationReason: `Verified seller-responsible non-delivery; dispute ${dispute.id}`,
              }
            : {}),
        },
      });

      if (orderUpdate.count !== 1) {
        throw new ApiError(
          409,
          "Order state changed before dispute resolution could be completed",
          "DISPUTE_ORDER_STATE_CHANGED",
        );
      }

      let nextDisputeStatus:
        | "RESOLVED_BUYER"
        | "RESOLVED_SELLER"
        | "PARTIALLY_RESOLVED";

      if (input.outcome === DisputeResolutionOutcome.REJECTED) {
        nextDisputeStatus = "RESOLVED_SELLER";
      } else if (refundAmount.isZero()) {
        nextDisputeStatus = "RESOLVED_SELLER";
      } else if (remainingEscrow.isZero()) {
        nextDisputeStatus = "RESOLVED_BUYER";
      } else {
        nextDisputeStatus = "PARTIALLY_RESOLVED";
      }

      const resolvedAt = new Date();

      const resolvedDispute = await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: nextDisputeStatus,
          resolutionOutcome: input.outcome,
          resolutionNote,
          approvedRefundAmount: refundAmount,
          resolvedAt,
          updatedAt: resolvedAt,
        },
        select: {
          id: true,
          orderId: true,
          buyerId: true,
          sellerId: true,
          status: true,
          resolutionOutcome: true,
          approvedRefundAmount: true,
          resolvedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorId: adminId,
          userId: dispute.buyerId,
          orderId: dispute.orderId,
          escrowId: dispute.escrowId,
          refundId,
          disputeId: dispute.id,
          action: "DISPUTE_RESOLVED",
          reference: `DISPUTE-RESOLUTION-${dispute.id}`,
          metadata: {
            outcome: input.outcome,
            disputeStatus: nextDisputeStatus,
            refundAmount: moneyString(refundAmount),
            cumulativeRefunds: moneyString(cumulativeRefunds),
            remainingEscrow: moneyString(remainingEscrow),
            escrowStatus: nextEscrowStatus,
            adminId,
            resolutionNote,
          },
        },
      });

      const refundLabel = `₦${moneyString(refundAmount)}`;

      await createResolutionNotification(tx, {
        recipientId: dispute.buyerId,
        disputeId: dispute.id,
        orderId: dispute.orderId,
        outcome: input.outcome,
        refundAmount: moneyString(refundAmount),
        audience: "buyer",
        title: "Dispute resolution completed",
        message: refundAmount.greaterThan(ZERO)
          ? `Your dispute has been resolved. Your refund is ${refundLabel}.`
          : "Your dispute has been reviewed and resolved. No refund was approved.",
      });

      await createResolutionNotification(tx, {
        recipientId: dispute.sellerId,
        disputeId: dispute.id,
        orderId: dispute.orderId,
        outcome: input.outcome,
        refundAmount: moneyString(refundAmount),
        audience: "seller",
        title: "Dispute resolution completed",
        message: refundAmount.greaterThan(ZERO)
          ? `A dispute on your order has been resolved with a buyer refund of ${refundLabel}.`
          : "A dispute on your order has been reviewed and resolved without a buyer refund.",
      });

      return {
        dispute: resolvedDispute,
        refund: {
          amount: moneyString(refundAmount),
          currency: dispute.escrow.currency,
          refundId,
          productRefundAmount: calculation.productRefundAmount,
          deliveryFeeRefundAmount: calculation.deliveryFeeRefundAmount,
          cumulativeRefundAmount: moneyString(cumulativeRefunds),
          remainingEscrowAmount: moneyString(remainingEscrow),
        },
        escrow: {
          id: dispute.escrowId,
          status: nextEscrowStatus,
          refundedAmount: moneyString(cumulativeRefunds),
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
}
