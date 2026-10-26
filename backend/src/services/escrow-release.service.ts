import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { getGlobalCommissionPolicy } from "./commission-policy.service.js";

type ReleaseEscrowInput = {
  escrowId: string;
  releaseReason?: string;
};

type ReleaseEscrowResult = {
  escrowId: string;
  orderId: string;
  grossAmount: string;
  commissionAmount: string;
  sellerNetAmount: string;
  alreadyReleased: boolean;
};

const INSPECTION_WINDOW_MS = 36 * 60 * 60 * 1000;
const ZERO = new Prisma.Decimal(0);
const COMMISSION_DENOMINATOR = 10_000;

function money(value: Prisma.Decimal | number | string): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function toMoneyString(value: Prisma.Decimal): string {
  return money(value).toFixed(2);
}

function assertNonNegativeMoney(
  value: Prisma.Decimal,
  fieldName: string,
): void {
  if (!value.isFinite() || value.isNegative()) {
    throw new ApiError(
      409,
      `${fieldName} must be a valid non-negative amount`,
      "INVALID_MONEY_AMOUNT",
    );
  }
}

function getMetadataString(
  metadata: Prisma.JsonValue | null,
  key: string,
): string | null {
  if (
    metadata !== null &&
    typeof metadata === "object" &&
    !Array.isArray(metadata)
  ) {
    const value = metadata[key];

    if (typeof value === "string") {
      return value;
    }
  }

  return null;
}

/**
 * Validates the actual delivery-confirmation path and its 36-hour window.
 *
 * Accepted paths:
 * 1. Buyer confirms receipt; inspection deadline starts at deliveredAt.
 * 2. Admin accepts delivery evidence; response deadline starts at reviewedAt.
 *
 * An order's DELIVERED status alone is insufficient.
 */

function validateDeliveryEligibility(escrow: {
  releaseEligibleAt: Date | null;
  order: {
    status: string;
    deliveredAt: Date | null;
    deliveryEvidence: Array<{
      id: string;
      buyerResponseDeadline: Date | null;
      reviewedAt: Date | null;
    }>;
    tracking: Array<{
      note: string | null;
      createdAt: Date;
    }>;
  };
}): void {
  const { order } = escrow;

  if (order.status !== "DELIVERED") {
    throw new ApiError(
      409,
      "The order must be delivered before escrow can be released",
      "ORDER_NOT_DELIVERED",
    );
  }

  if (!order.deliveredAt || !escrow.releaseEligibleAt) {
    throw new ApiError(
      409,
      "Delivery confirmation timestamps are missing",
      "DELIVERY_CONFIRMATION_INCOMPLETE",
    );
  }

  const acceptedEvidence = order.deliveryEvidence[0] ?? null;

  let eligibleAt: Date;

  if (acceptedEvidence) {
    if (
      !acceptedEvidence.reviewedAt ||
      !acceptedEvidence.buyerResponseDeadline
    ) {
      throw new ApiError(
        409,
        "Accepted delivery evidence is missing its review or response deadline",
        "DELIVERY_EVIDENCE_DEADLINE_MISSING",
      );
    }

    // Admin acceptance must be the delivery event that marked the
    // order DELIVERED. Both timestamps are assigned in the same review.
    if (acceptedEvidence.reviewedAt.getTime() !== order.deliveredAt.getTime()) {
      throw new ApiError(
        409,
        "Accepted evidence does not match the order's delivery timestamp",
        "DELIVERY_EVIDENCE_TIMESTAMP_MISMATCH",
      );
    }

    const expectedDeadline = new Date(
      acceptedEvidence.reviewedAt.getTime() + INSPECTION_WINDOW_MS,
    );

    if (
      acceptedEvidence.buyerResponseDeadline.getTime() !==
        expectedDeadline.getTime() ||
      escrow.releaseEligibleAt.getTime() !== expectedDeadline.getTime()
    ) {
      throw new ApiError(
        409,
        "The accepted evidence deadline does not match the original 36-hour window",
        "ESCROW_DEADLINE_MISMATCH",
      );
    }

    eligibleAt = expectedDeadline;
  } else {
    // This query must return buyer-confirmation tracking specifically,
    // rather than whichever DELIVERED tracking record is newest.
    const buyerConfirmedDelivery = order.tracking.some((entry) =>
      entry.note?.startsWith("Buyer confirmed receipt."),
    );

    if (!buyerConfirmedDelivery) {
      throw new ApiError(
        409,
        "Delivery must be confirmed by the buyer or accepted through delivery evidence review",
        "DELIVERY_CONFIRMATION_REQUIRED",
      );
    }

    const expectedDeadline = new Date(
      order.deliveredAt.getTime() + INSPECTION_WINDOW_MS,
    );

    if (escrow.releaseEligibleAt.getTime() !== expectedDeadline.getTime()) {
      throw new ApiError(
        409,
        "The buyer inspection deadline does not match the original delivery timestamp",
        "INVALID_BUYER_INSPECTION_WINDOW",
      );
    }

    eligibleAt = expectedDeadline;
  }

  if (eligibleAt.getTime() > Date.now()) {
    throw new ApiError(
      409,
      "The 36-hour inspection or response window has not ended",
      "ESCROW_NOT_ELIGIBLE",
    );
  }
}

/**
 * Releases the remaining escrow funds after completed refunds.
 *
 * Important:
 * - escrow.amount remains the original funded amount.
 * - Completed Refund records determine the cumulative refund amount.
 * - Escrow.refundedAmount must agree with completed Refund records.
 * - Active disputes block release.
 * - Original commission is retained where remaining funds can cover it.
 * - Commission is reduced only by the unavoidable shortfall.
 * - Buyer held funds are debited only by the remaining settlement amount.
 * - The escrow row is locked before financial processing.
 * - Repeated successful release requests never transfer funds twice.
 */
export async function releaseEscrow(
  input: ReleaseEscrowInput,
): Promise<ReleaseEscrowResult> {
  const escrowId = input.escrowId?.trim();

  if (!escrowId) {
    throw new ApiError(400, "Escrow ID is required", "ESCROW_ID_REQUIRED");
  }

  return prisma.$transaction(
    async (tx) => {
      // Read only the relationship needed to establish the lock order.
      const escrowLocator = await tx.escrow.findUnique({
        where: { id: escrowId },
        select: { id: true, orderId: true },
      });

      if (!escrowLocator) {
        throw new ApiError(404, "Escrow not found", "ESCROW_NOT_FOUND");
      }

      // 1. Lock Order first, matching dispute opening and resolution.
      const lockedOrders = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Order"
        WHERE "id" = ${escrowLocator.orderId}
        FOR UPDATE
      `;

      if (lockedOrders.length !== 1) {
        throw new ApiError(
          409,
          "The order associated with this escrow was not found",
          "ESCROW_ORDER_NOT_FOUND",
        );
      }

      // 2. Lock the order's single dispute, if one exists.
      const disputeLocator = await tx.dispute.findUnique({
        where: { orderId: escrowLocator.orderId },
        select: { id: true },
      });

      if (disputeLocator) {
        const lockedDisputes = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Dispute"
          WHERE "id" = ${disputeLocator.id}
          FOR UPDATE
        `;

        if (lockedDisputes.length !== 1) {
          throw new ApiError(
            409,
            "The order dispute could not be locked",
            "ESCROW_DISPUTE_LOCK_FAILED",
          );
        }
      }

      // 3. Lock Escrow only after Order and Dispute.
      const lockedEscrows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Escrow"
        WHERE "id" = ${escrowId}
        FOR UPDATE
      `;

      if (lockedEscrows.length !== 1) {
        throw new ApiError(404, "Escrow not found", "ESCROW_NOT_FOUND");
      }

      // Reload the escrow and all relevant relations after locking.
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
        include: {
          order: {
            include: {
              store: {
                select: {
                  id: true,
                  ownerId: true,
                },
              },
              deliveryEvidence: {
                where: { status: "ACCEPTED" },
                orderBy: { reviewedAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  buyerResponseDeadline: true,
                  reviewedAt: true,
                },
              },
              tracking: {
                where: {
                  status: "DELIVERED",
                  note: {
                    startsWith: "Buyer confirmed receipt.",
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  note: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!escrow) {
        throw new ApiError(404, "Escrow not found", "ESCROW_NOT_FOUND");
      }

      if (escrow.orderId !== escrowLocator.orderId) {
        throw new ApiError(
          409,
          "The escrow's order association changed unexpectedly",
          "ESCROW_ORDER_MISMATCH",
        );
      }

      const originalEscrowAmount = money(escrow.amount);
      assertNonNegativeMoney(originalEscrowAmount, "Original escrow amount");

      /*
       * Completed refund records are the financial source of truth.
       * Pending, failed, cancelled, and processing refunds do not reduce
       * the settled amount.
       */
      const refundAggregate = await tx.refund.aggregate({
        where: {
          escrowId: escrow.id,
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      });

      const completedRefunds = money(refundAggregate._sum.amount ?? ZERO);
      const recordedRefunds = money(escrow.refundedAmount ?? ZERO);

      assertNonNegativeMoney(completedRefunds, "Completed refunds");

      if (!completedRefunds.equals(recordedRefunds)) {
        throw new ApiError(
          409,
          "Escrow refund totals do not match completed refund records",
          "ESCROW_REFUND_TOTAL_MISMATCH",
        );
      }

      if (completedRefunds.greaterThan(originalEscrowAmount)) {
        throw new ApiError(
          409,
          "Completed refunds exceed the original escrow amount",
          "REFUND_TOTAL_EXCEEDS_ESCROW",
        );
      }

      const remainingEscrow = money(
        originalEscrowAmount.minus(completedRefunds),
      );

      /*
       * Idempotent retry: use the previously saved settlement values.
       * Never credit any wallet again for an already released escrow.
       */

      if (escrow.status === "RELEASED") {
        const savedGross = getMetadataString(
          escrow.metadata,
          "releasedGrossAmount",
        );

        const savedCommission = getMetadataString(
          escrow.metadata,
          "commissionAmount",
        );

        const savedSellerNet = getMetadataString(
          escrow.metadata,
          "sellerNetAmount",
        );

        if (
          savedGross === null ||
          savedCommission === null ||
          savedSellerNet === null ||
          escrow.releasedAmount === null
        ) {
          throw new ApiError(
            409,
            "Released escrow is missing its saved settlement amounts",
            "ESCROW_SETTLEMENT_METADATA_MISSING",
          );
        }

        const grossAmount = money(savedGross);
        const commissionAmount = money(savedCommission);
        const sellerNetAmount = money(savedSellerNet);
        const releasedAmount = money(escrow.releasedAmount);

        assertNonNegativeMoney(grossAmount, "Released gross amount");
        assertNonNegativeMoney(commissionAmount, "Commission amount");
        assertNonNegativeMoney(sellerNetAmount, "Seller net amount");

        if (
          !grossAmount.equals(releasedAmount) ||
          !grossAmount.equals(remainingEscrow) ||
          commissionAmount.greaterThan(grossAmount) ||
          !grossAmount.minus(commissionAmount).equals(sellerNetAmount)
        ) {
          throw new ApiError(
            409,
            "Saved escrow settlement amounts are inconsistent",
            "ESCROW_SETTLEMENT_METADATA_INVALID",
          );
        }

        return {
          escrowId: escrow.id,
          orderId: escrow.orderId,
          grossAmount: toMoneyString(grossAmount),
          commissionAmount: toMoneyString(commissionAmount),
          sellerNetAmount: toMoneyString(sellerNetAmount),
          alreadyReleased: true,
        };
      }

      if (escrow.status !== "HELD" && escrow.status !== "PARTIALLY_REFUNDED") {
        throw new ApiError(
          409,
          `Escrow cannot be released while its status is ${escrow.status}`,
          "ESCROW_NOT_RELEASABLE",
        );
      }

      if (remainingEscrow.isZero()) {
        throw new ApiError(
          409,
          "No escrow funds remain after refunds",
          "ESCROW_HAS_NO_REMAINING_FUNDS",
        );
      }

      if (
        escrow.order.paymentStatus !== "PAID" &&
        escrow.order.paymentStatus !== "PARTIALLY_REFUNDED"
      ) {
        throw new ApiError(
          409,
          "Order payment must be paid or partially refunded before escrow can be released",
          "ORDER_NOT_PAID",
        );
      }

      validateDeliveryEligibility(escrow);

      if (
        escrow.buyerId !== escrow.order.userId ||
        escrow.sellerId !== escrow.order.store.ownerId
      ) {
        throw new ApiError(
          409,
          "Escrow parties do not match the order",
          "ESCROW_PARTY_MISMATCH",
        );
      }

      if (escrow.buyerId === escrow.sellerId) {
        throw new ApiError(
          409,
          "The buyer and seller cannot be the same account",
          "INVALID_ESCROW_PARTIES",
        );
      }

      const activeDispute = await tx.dispute.findUnique({
        where: {
          orderId: escrow.orderId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (
        activeDispute &&
        (activeDispute.status === "OPEN" ||
          activeDispute.status === "UNDER_REVIEW")
      ) {
        throw new ApiError(
          409,
          "Escrow cannot be released while a dispute is active",
          "ESCROW_DISPUTED",
        );
      }

      const policy = await getGlobalCommissionPolicy(tx);

      if (
        !Number.isInteger(policy.rateBps) ||
        policy.rateBps < 0 ||
        policy.rateBps > COMMISSION_DENOMINATOR
      ) {
        throw new ApiError(
          409,
          "The platform commission policy contains an invalid rate",
          "INVALID_COMMISSION_POLICY",
        );
      }

      /*
       * Commission basis stays tied to the original order total.
       * Refunds do not change the historical order or original commission.
       */
      const commissionBasis = money(escrow.order.total);

      if (!commissionBasis.equals(originalEscrowAmount)) {
        throw new ApiError(
          409,
          "Original escrow amount does not match the order total",
          "ESCROW_AMOUNT_MISMATCH",
        );
      }

      const originalCommission = money(
        commissionBasis.mul(policy.rateBps).div(COMMISSION_DENOMINATOR),
      );

      assertNonNegativeMoney(originalCommission, "Calculated commission");

      if (originalCommission.greaterThan(originalEscrowAmount)) {
        throw new ApiError(
          409,
          "Commission cannot exceed the original escrow amount",
          "INVALID_COMMISSION_AMOUNT",
        );
      }

      /*
       * ROA retains the original commission whenever remaining funds can
       * cover it. If funds are insufficient, commission is reduced only by
       * the unavoidable shortfall.
       */
      const commission = money(
        originalCommission.greaterThan(remainingEscrow)
          ? remainingEscrow
          : originalCommission,
      );

      const commissionReduction = money(originalCommission.minus(commission));

      const sellerNetAmount = money(remainingEscrow.minus(commission));

      const buyerWallet = await tx.wallet.findUnique({
        where: {
          userId: escrow.buyerId,
        },
      });

      const sellerWallet = await tx.wallet.findUnique({
        where: {
          userId: escrow.sellerId,
        },
      });

      if (!buyerWallet || !buyerWallet.isActive) {
        throw new ApiError(
          409,
          "The buyer wallet is missing or inactive",
          "BUYER_WALLET_UNAVAILABLE",
        );
      }

      if (!sellerWallet || !sellerWallet.isActive) {
        throw new ApiError(
          409,
          "The seller wallet is missing or inactive",
          "SELLER_WALLET_UNAVAILABLE",
        );
      }

      if (
        buyerWallet.currency !== escrow.currency ||
        sellerWallet.currency !== escrow.currency
      ) {
        throw new ApiError(
          409,
          "Wallet currency does not match the escrow currency",
          "WALLET_CURRENCY_MISMATCH",
        );
      }

      let platformWallet: NonNullable<typeof buyerWallet> | null = null;

      if (commission.greaterThan(ZERO)) {
        platformWallet = await tx.wallet.findFirst({
          where: {
            ownerType: "PLATFORM",
            currency: escrow.currency,
            isActive: true,
          },
        });

        if (!platformWallet) {
          throw new ApiError(
            409,
            "The ROA platform wallet is not configured for this currency",
            "PLATFORM_WALLET_UNAVAILABLE",
          );
        }
      }

      /*
       * Lock participating wallets in a consistent order. The escrow row
       * is already locked, matching the order used by dispute resolution.
       */
      const walletIds = [
        buyerWallet.id,
        sellerWallet.id,
        ...(platformWallet ? [platformWallet.id] : []),
      ];

      const uniqueWalletIds = [...new Set(walletIds)].sort();

      await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT "id"
          FROM "Wallet"
          WHERE "id" IN (${Prisma.join(uniqueWalletIds)})
          ORDER BY "id"
          FOR UPDATE
        `,
      );

      /*
       * Claim the escrow conditionally. The transaction rolls back all
       * changes if the state is no longer eligible.
       */
      const claimed = await tx.escrow.updateMany({
        where: {
          id: escrow.id,
          status: {
            in: ["HELD", "PARTIALLY_REFUNDED"],
          },
        },
        data: {
          status: "RELEASE_PENDING",
        },
      });

      if (claimed.count !== 1) {
        throw new ApiError(
          409,
          "Escrow is already being processed or has changed status",
          "ESCROW_RELEASE_CONFLICT",
        );
      }

      /*
       * Refunds have already reduced the buyer's held balance. Debit only
       * the remaining funds, never the original full escrow amount.
       */
      const buyerUpdated = await tx.wallet.updateMany({
        where: {
          id: buyerWallet.id,
          isActive: true,
          currency: escrow.currency,
          heldBalance: {
            gte: remainingEscrow,
          },
        },
        data: {
          heldBalance: {
            decrement: remainingEscrow,
          },
        },
      });

      if (buyerUpdated.count !== 1) {
        throw new ApiError(
          409,
          "The buyer wallet does not have enough held funds for the remaining settlement",
          "INSUFFICIENT_HELD_BALANCE",
        );
      }

      if (sellerNetAmount.greaterThan(ZERO)) {
        const sellerUpdated = await tx.wallet.updateMany({
          where: {
            id: sellerWallet.id,
            isActive: true,
            currency: escrow.currency,
          },
          data: {
            availableBalance: {
              increment: sellerNetAmount,
            },
          },
        });

        if (sellerUpdated.count !== 1) {
          throw new ApiError(
            409,
            "Could not credit the seller wallet",
            "SELLER_CREDIT_FAILED",
          );
        }
      }

      if (commission.greaterThan(ZERO) && platformWallet) {
        const platformUpdated = await tx.wallet.updateMany({
          where: {
            id: platformWallet.id,
            isActive: true,
            currency: escrow.currency,
          },
          data: {
            availableBalance: {
              increment: commission,
            },
          },
        });

        if (platformUpdated.count !== 1) {
          throw new ApiError(
            409,
            "Could not credit the platform wallet",
            "PLATFORM_CREDIT_FAILED",
          );
        }
      }

      const buyerAfter = await tx.wallet.findUniqueOrThrow({
        where: {
          id: buyerWallet.id,
        },
      });

      const sellerAfter = await tx.wallet.findUniqueOrThrow({
        where: {
          id: sellerWallet.id,
        },
      });

      const platformAfter =
        commission.greaterThan(ZERO) && platformWallet
          ? await tx.wallet.findUniqueOrThrow({
              where: {
                id: platformWallet.id,
              },
            })
          : null;

      const referenceSuffix = escrow.id;

      await tx.walletLedger.create({
        data: {
          walletId: buyerWallet.id,
          type: "ESCROW_RELEASE",
          status: "COMPLETED",
          amount: remainingEscrow,
          currency: escrow.currency,
          availableBalanceBefore: buyerAfter.availableBalance,
          availableBalanceAfter: buyerAfter.availableBalance,
          heldBalanceBefore: buyerAfter.heldBalance.plus(remainingEscrow),
          heldBalanceAfter: buyerAfter.heldBalance,
          orderId: escrow.orderId,
          escrowId: escrow.id,
          reference: `ESCROW-RELEASE-BUYER-${referenceSuffix}`,
          idempotencyKey: `escrow:${escrow.id}:release:buyer`,
          description: "Remaining held order funds released from buyer wallet",
          metadata: {
            orderId: escrow.orderId,
            escrowId: escrow.id,
            side: "BUYER",
            originalEscrowAmount: toMoneyString(originalEscrowAmount),
            completedRefunds: toMoneyString(completedRefunds),
            releasedGrossAmount: toMoneyString(remainingEscrow),
          },
        },
      });

      if (sellerNetAmount.greaterThan(ZERO)) {
        await tx.walletLedger.create({
          data: {
            walletId: sellerWallet.id,
            type: "ESCROW_RELEASE",
            status: "COMPLETED",
            amount: sellerNetAmount,
            currency: escrow.currency,
            availableBalanceBefore:
              sellerAfter.availableBalance.minus(sellerNetAmount),
            availableBalanceAfter: sellerAfter.availableBalance,
            heldBalanceBefore: sellerAfter.heldBalance,
            heldBalanceAfter: sellerAfter.heldBalance,
            orderId: escrow.orderId,
            escrowId: escrow.id,
            reference: `ESCROW-RELEASE-SELLER-${referenceSuffix}`,
            idempotencyKey: `escrow:${escrow.id}:release:seller`,
            description: "Remaining order proceeds credited to seller wallet",
            metadata: {
              orderId: escrow.orderId,
              escrowId: escrow.id,
              side: "SELLER",
              releasedGrossAmount: toMoneyString(remainingEscrow),
            },
          },
        });
      }

      if (commission.greaterThan(ZERO) && platformAfter) {
        await tx.walletLedger.create({
          data: {
            walletId: platformAfter.id,
            type: "COMMISSION",
            status: "COMPLETED",
            amount: commission,
            currency: escrow.currency,
            availableBalanceBefore:
              platformAfter.availableBalance.minus(commission),
            availableBalanceAfter: platformAfter.availableBalance,
            heldBalanceBefore: platformAfter.heldBalance,
            heldBalanceAfter: platformAfter.heldBalance,
            orderId: escrow.orderId,
            escrowId: escrow.id,
            reference: `ESCROW-COMMISSION-${referenceSuffix}`,
            idempotencyKey: `escrow:${escrow.id}:commission`,
            description: "ROA commission retained from order settlement",
            metadata: {
              orderId: escrow.orderId,
              escrowId: escrow.id,
              side: "PLATFORM",
              originalCommissionAmount: toMoneyString(originalCommission),
              commissionReductionAmount: toMoneyString(commissionReduction),
              commissionRateBps: policy.rateBps,
            },
          },
        });
      }

      const now = new Date();

      await tx.escrow.update({
        where: {
          id: escrow.id,
        },
        data: {
          status: "RELEASED",
          releasedAt: now,
          releasedAmount: remainingEscrow,
          releaseReason:
            input.releaseReason?.trim() ||
            "Delivery confirmed; 36-hour inspection window passed",
          metadata: {
            ...(escrow.metadata &&
            typeof escrow.metadata === "object" &&
            !Array.isArray(escrow.metadata)
              ? escrow.metadata
              : {}),
            originalEscrowAmount: toMoneyString(originalEscrowAmount),
            completedRefunds: toMoneyString(completedRefunds),
            releasedGrossAmount: toMoneyString(remainingEscrow),
            commissionRateBps: policy.rateBps,
            commissionBasisAmount: toMoneyString(commissionBasis),
            originalCommissionAmount: toMoneyString(originalCommission),
            commissionAmount: toMoneyString(commission),
            commissionReductionAmount: toMoneyString(commissionReduction),
            sellerNetAmount: toMoneyString(sellerNetAmount),
            releasedAt: now.toISOString(),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: "SYSTEM",
          action: "ESCROW_RELEASED",
          orderId: escrow.orderId,
          escrowId: escrow.id,
          userId: escrow.sellerId,
          reference: `ESCROW-RELEASE-${referenceSuffix}`,
          metadata: {
            originalEscrowAmount: toMoneyString(originalEscrowAmount),
            completedRefunds: toMoneyString(completedRefunds),
            grossAmount: toMoneyString(remainingEscrow),
            originalCommissionAmount: toMoneyString(originalCommission),
            commissionAmount: toMoneyString(commission),
            commissionReductionAmount: toMoneyString(commissionReduction),
            sellerNetAmount: toMoneyString(sellerNetAmount),
            commissionRateBps: policy.rateBps,
          },
        },
      });

      return {
        escrowId: escrow.id,
        orderId: escrow.orderId,
        grossAmount: toMoneyString(remainingEscrow),
        commissionAmount: toMoneyString(commission),
        sellerNetAmount: toMoneyString(sellerNetAmount),
        alreadyReleased: false,
      };
    },
    {
      maxWait: 10_000,
      timeout: 20_000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
