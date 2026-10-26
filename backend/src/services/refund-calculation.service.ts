import {
  DisputeItemOutcome,
  DisputeResolutionOutcome,
  Prisma,
} from "../../generated/prisma/client.js";

import { ApiError } from "../utils/api-error.js";

type MoneyInput = Prisma.Decimal | number | string;

export type RefundCalculationOrderItem = {
  id: string;
  quantity: number;
  subtotal: MoneyInput;
  status: string;
};

export type RefundCalculationDisputeItem = {
  id: string;
  orderItemId: string;
  claimedQuantity: number;
  approvedQuantity: number | null;
  outcome: DisputeItemOutcome | null;
};

export type CalculateDisputeRefundInput = {
  resolutionOutcome: DisputeResolutionOutcome;

  orderSubtotal: MoneyInput;
  orderDiscount: MoneyInput;
  deliveryFee: MoneyInput;
  orderTotal: MoneyInput;

  escrowAmount: MoneyInput;
  alreadyRefundedAmount?: MoneyInput;

  orderItems: RefundCalculationOrderItem[];
  disputeItems: RefundCalculationDisputeItem[];
};

export type CalculatedRefundItem = {
  disputeItemId: string | null;
  orderItemId: string;
  approvedQuantity: number;
  outcome: DisputeItemOutcome;
  rateBps: number;
  amount: string;
};

export type DisputeRefundCalculation = {
  resolutionOutcome: DisputeResolutionOutcome;
  items: CalculatedRefundItem[];
  productRefundAmount: string;
  deliveryFeeRefundAmount: string;
  totalRefundAmount: string;
  originalOrderTotal: string;
  alreadyRefundedAmount: string;
  remainingEscrowBeforeRefund: string;
  remainingEscrowAfterRefund: string;
  refundType: "FULL" | "PARTIAL" | null;
};

const ZERO = new Prisma.Decimal(0);
const ONE_HUNDRED_PERCENT_BPS = 10_000;

const REFUND_RATE_BPS: Record<DisputeItemOutcome, number> = {
  REJECTED: 0,
  MINOR_DEFECT: 1_000,
  MODERATE_DEFECT: 2_500,
  MAJOR_DEFECT_OR_MISMATCH: 5_000,
  UNUSABLE_OR_FUNDAMENTALLY_DIFFERENT: 10_000,
  MISSING_ITEM: 10_000,
};

function decimal(value: MoneyInput, fieldName: string): Prisma.Decimal {
  let result: Prisma.Decimal;

  try {
    result = new Prisma.Decimal(value);
  } catch {
    throw new ApiError(
      409,
      `${fieldName} must be a valid monetary amount`,
      "INVALID_REFUND_CALCULATION_AMOUNT",
    );
  }

  if (!result.isFinite() || result.isNegative()) {
    throw new ApiError(
      409,
      `${fieldName} must be a valid non-negative monetary amount`,
      "INVALID_REFUND_CALCULATION_AMOUNT",
    );
  }

  return result;
}

function money(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2);
}

function moneyString(value: Prisma.Decimal): string {
  return money(value).toFixed(2);
}

function sumMoney(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce((total, value) => total.plus(value), ZERO);
}

/**
 * Allocates the order-level discount proportionally across all order items.
 * Any rounding remainder is applied deterministically to the largest item.
 */
function calculateNetItemValues(input: {
  orderItems: RefundCalculationOrderItem[];
  orderSubtotal: Prisma.Decimal;
  orderDiscount: Prisma.Decimal;
}): Map<string, Prisma.Decimal> {
  const { orderItems, orderSubtotal, orderDiscount } = input;

  if (orderItems.length === 0) {
    throw new ApiError(
      409,
      "The order has no items available for refund calculation",
      "REFUND_ORDER_ITEMS_MISSING",
    );
  }

  const seenIds = new Set<string>();

  const preparedItems = orderItems.map((item) => {
    if (!item.id || seenIds.has(item.id)) {
      throw new ApiError(
        409,
        "Order items contain missing or duplicate IDs",
        "REFUND_ORDER_ITEMS_INVALID",
      );
    }

    seenIds.add(item.id);

    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new ApiError(
        409,
        "An order item has an invalid purchased quantity",
        "REFUND_ORDER_ITEM_QUANTITY_INVALID",
      );
    }

    return {
      ...item,
      subtotal: decimal(item.subtotal, `Item ${item.id} subtotal`),
    };
  });

  const actualSubtotal = sumMoney(preparedItems.map((item) => item.subtotal));

  if (!actualSubtotal.equals(orderSubtotal)) {
    throw new ApiError(
      409,
      "Order item subtotals do not match the recorded order subtotal",
      "REFUND_ORDER_SUBTOTAL_MISMATCH",
    );
  }

  if (orderDiscount.greaterThan(orderSubtotal)) {
    throw new ApiError(
      409,
      "Order discount exceeds the order subtotal",
      "REFUND_ORDER_DISCOUNT_INVALID",
    );
  }

  if (orderSubtotal.isZero() && !orderDiscount.isZero()) {
    throw new ApiError(
      409,
      "A discount cannot be allocated to a zero-value subtotal",
      "REFUND_DISCOUNT_ALLOCATION_INVALID",
    );
  }

  const allocatedDiscounts = new Map<string, Prisma.Decimal>();
  let allocatedTotal = ZERO;

  for (const item of preparedItems) {
    const allocation = orderSubtotal.isZero()
      ? ZERO
      : money(orderDiscount.mul(item.subtotal).div(orderSubtotal));

    allocatedDiscounts.set(item.id, allocation);
    allocatedTotal = allocatedTotal.plus(allocation);
  }

  const remainder = money(orderDiscount.minus(allocatedTotal));

  if (!remainder.isZero()) {
    const largestItem = [...preparedItems].sort((a, b) => {
      const comparison = b.subtotal.comparedTo(a.subtotal);
      return comparison !== 0 ? comparison : a.id.localeCompare(b.id);
    })[0];

    if (!largestItem) {
      throw new ApiError(
        409,
        "Could not allocate the order discount",
        "REFUND_DISCOUNT_ALLOCATION_FAILED",
      );
    }

    const currentAllocation = allocatedDiscounts.get(largestItem.id) ?? ZERO;

    const adjustedAllocation = money(currentAllocation.plus(remainder));

    if (
      adjustedAllocation.isNegative() ||
      adjustedAllocation.greaterThan(largestItem.subtotal)
    ) {
      throw new ApiError(
        409,
        "Order discount allocation produced an invalid item value",
        "REFUND_DISCOUNT_ALLOCATION_FAILED",
      );
    }

    allocatedDiscounts.set(largestItem.id, adjustedAllocation);
  }

  const netValues = new Map<string, Prisma.Decimal>();

  for (const item of preparedItems) {
    const allocatedDiscount = allocatedDiscounts.get(item.id) ?? ZERO;

    netValues.set(item.id, money(item.subtotal.minus(allocatedDiscount)));
  }

  return netValues;
}

function validateOrderTotals(input: {
  orderSubtotal: Prisma.Decimal;
  orderDiscount: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  orderTotal: Prisma.Decimal;
  escrowAmount: Prisma.Decimal;
}): void {
  const expectedTotal = money(
    input.orderSubtotal.minus(input.orderDiscount).plus(input.deliveryFee),
  );

  if (!expectedTotal.equals(input.orderTotal)) {
    throw new ApiError(
      409,
      "Order total does not match its subtotal, discount, and delivery fee",
      "REFUND_ORDER_TOTAL_MISMATCH",
    );
  }

  if (!input.escrowAmount.equals(input.orderTotal)) {
    throw new ApiError(
      409,
      "Original escrow amount does not match the recorded order total",
      "REFUND_ESCROW_AMOUNT_MISMATCH",
    );
  }
}

/**
 * Calculates a dispute refund without moving money.
 *
 * Policy:
 * - Rejected disputes produce no refund.
 * - Product compensation applies only to approved quantities of disputed items.
 * - Delivered-order disputes never refund delivery fees.
 * - A verified seller-responsible non-delivery refunds eligible product value
 *   and the applicable delivery fee.
 *
 * IMPORTANT:
 * The caller must verify the persisted order/dispute state and authorize the
 * resolution before calling this function. In particular, only a verified
 * seller-responsible non-delivery outcome may use the non-delivery branch.
 *
 * This function does not credit wallets, create Refund records, update escrow,
 * or calculate ROA commission settlement.
 */
export function calculateDisputeRefund(
  input: CalculateDisputeRefundInput,
): DisputeRefundCalculation {
  const orderSubtotal = decimal(input.orderSubtotal, "Order subtotal");
  const orderDiscount = decimal(input.orderDiscount, "Order discount");
  const deliveryFee = decimal(input.deliveryFee, "Delivery fee");
  const orderTotal = decimal(input.orderTotal, "Order total");
  const escrowAmount = decimal(input.escrowAmount, "Escrow amount");

  const alreadyRefundedAmount = decimal(
    input.alreadyRefundedAmount ?? ZERO,
    "Previously refunded amount",
  );

  validateOrderTotals({
    orderSubtotal,
    orderDiscount,
    deliveryFee,
    orderTotal,
    escrowAmount,
  });

  if (alreadyRefundedAmount.greaterThan(escrowAmount)) {
    throw new ApiError(
      409,
      "Previously refunded funds exceed the original escrow amount",
      "REFUND_TOTAL_EXCEEDS_ESCROW",
    );
  }

  const remainingBefore = money(escrowAmount.minus(alreadyRefundedAmount));

  const netItemValues = calculateNetItemValues({
    orderItems: input.orderItems,
    orderSubtotal,
    orderDiscount,
  });

  const orderItemsById = new Map(
    input.orderItems.map((item) => [item.id, item]),
  );

  const disputeItemsByOrderItemId = new Map<
    string,
    RefundCalculationDisputeItem
  >();

  for (const item of input.disputeItems) {
    if (disputeItemsByOrderItemId.has(item.orderItemId)) {
      throw new ApiError(
        409,
        "A disputed order item appears more than once",
        "DUPLICATE_DISPUTE_ITEM",
      );
    }

    if (!orderItemsById.has(item.orderItemId)) {
      throw new ApiError(
        409,
        "A disputed item does not belong to the order",
        "DISPUTE_ITEM_ORDER_MISMATCH",
      );
    }

    disputeItemsByOrderItemId.set(item.orderItemId, item);
  }

  let itemRefunds: CalculatedRefundItem[] = [];
  let deliveryFeeRefundAmount = ZERO;

  switch (input.resolutionOutcome) {
    case DisputeResolutionOutcome.REJECTED: {
      itemRefunds = input.disputeItems.map((item) => ({
        disputeItemId: item.id,
        orderItemId: item.orderItemId,
        approvedQuantity: 0,
        outcome: DisputeItemOutcome.REJECTED,
        rateBps: 0,
        amount: "0.00",
      }));

      break;
    }

    case DisputeResolutionOutcome.PRODUCT_COMPENSATION: {
      if (input.disputeItems.length === 0) {
        throw new ApiError(
          400,
          "Product compensation requires at least one disputed order item",
          "PRODUCT_DISPUTE_ITEMS_REQUIRED",
        );
      }

      itemRefunds = input.disputeItems.map((claim) => {
        const orderItem = orderItemsById.get(claim.orderItemId);
        const netItemValue = netItemValues.get(claim.orderItemId);

        if (!orderItem || !netItemValue) {
          throw new ApiError(
            409,
            "A disputed item does not belong to the order",
            "DISPUTE_ITEM_ORDER_MISMATCH",
          );
        }

        if (orderItem.status !== "ACTIVE") {
          throw new ApiError(
            409,
            "A non-active order item cannot receive a product refund",
            "DISPUTE_ORDER_ITEM_NOT_ACTIVE",
          );
        }

        if (
          !Number.isSafeInteger(claim.claimedQuantity) ||
          claim.claimedQuantity <= 0 ||
          claim.claimedQuantity > orderItem.quantity
        ) {
          throw new ApiError(
            409,
            "Claimed quantity exceeds the purchased quantity",
            "DISPUTE_CLAIMED_QUANTITY_INVALID",
          );
        }

        if (claim.outcome === null || claim.approvedQuantity === null) {
          throw new ApiError(
            409,
            "Every disputed item needs a verified outcome and approved quantity",
            "DISPUTE_ITEM_DECISION_INCOMPLETE",
          );
        }

        if (
          !Number.isSafeInteger(claim.approvedQuantity) ||
          claim.approvedQuantity < 0 ||
          claim.approvedQuantity > claim.claimedQuantity
        ) {
          throw new ApiError(
            409,
            "Approved quantity must be between zero and the claimed quantity",
            "DISPUTE_APPROVED_QUANTITY_INVALID",
          );
        }

        const rateBps = REFUND_RATE_BPS[claim.outcome];

        if (claim.outcome === DisputeItemOutcome.REJECTED) {
          if (claim.approvedQuantity !== 0) {
            throw new ApiError(
              409,
              "A rejected item claim must have zero approved quantity",
              "REJECTED_ITEM_HAS_APPROVED_QUANTITY",
            );
          }

          return {
            disputeItemId: claim.id,
            orderItemId: orderItem.id,
            approvedQuantity: 0,
            outcome: claim.outcome,
            rateBps,
            amount: "0.00",
          };
        }

        if (claim.approvedQuantity <= 0) {
          throw new ApiError(
            409,
            "A compensable claim must approve at least one unit",
            "APPROVED_ITEM_QUANTITY_REQUIRED",
          );
        }

        const affectedPaidValue = netItemValue
          .mul(claim.approvedQuantity)
          .div(orderItem.quantity);

        const refundAmount = money(
          affectedPaidValue.mul(rateBps).div(ONE_HUNDRED_PERCENT_BPS),
        );

        return {
          disputeItemId: claim.id,
          orderItemId: orderItem.id,
          approvedQuantity: claim.approvedQuantity,
          outcome: claim.outcome,
          rateBps,
          amount: moneyString(refundAmount),
        };
      });

      // Intentionally no delivery-fee refund for delivered-order disputes.
      deliveryFeeRefundAmount = ZERO;

      break;
    }

    case DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY: {
      if (input.disputeItems.length !== input.orderItems.length) {
        throw new ApiError(
          409,
          "Non-delivery claims must track every item in the order",
          "NON_DELIVERY_ITEMS_INCOMPLETE",
        );
      }

      itemRefunds = input.orderItems.map((orderItem) => {
        const claim = disputeItemsByOrderItemId.get(orderItem.id);
        const itemValue = netItemValues.get(orderItem.id);

        if (
          !claim ||
          !itemValue ||
          claim.claimedQuantity !== orderItem.quantity ||
          orderItem.status !== "ACTIVE"
        ) {
          throw new ApiError(
            409,
            "Non-delivery item records do not match the order",
            "NON_DELIVERY_ITEM_MISMATCH",
          );
        }

        return {
          disputeItemId: claim.id,
          orderItemId: orderItem.id,
          approvedQuantity: orderItem.quantity,
          outcome: DisputeItemOutcome.MISSING_ITEM,
          rateBps: ONE_HUNDRED_PERCENT_BPS,
          amount: moneyString(itemValue),
        };
      });

      // The only outcome that refunds the applicable delivery fee.
      deliveryFeeRefundAmount = deliveryFee;

      break;
    }

    default: {
      const exhaustiveCheck: never = input.resolutionOutcome;

      throw new ApiError(
        400,
        `Unsupported dispute resolution outcome: ${exhaustiveCheck}`,
        "UNSUPPORTED_DISPUTE_RESOLUTION_OUTCOME",
      );
    }
  }

  const productRefundAmount = money(
    sumMoney(itemRefunds.map((item) => new Prisma.Decimal(item.amount))),
  );

  const totalRefundAmount = money(
    productRefundAmount.plus(deliveryFeeRefundAmount),
  );

  if (totalRefundAmount.greaterThan(remainingBefore)) {
    throw new ApiError(
      409,
      "The calculated refund exceeds the remaining escrow funds",
      "REFUND_EXCEEDS_REMAINING_ESCROW",
    );
  }

  const remainingAfter = money(remainingBefore.minus(totalRefundAmount));

  const cumulativeRefunds = money(
    alreadyRefundedAmount.plus(totalRefundAmount),
  );

  const refundType = totalRefundAmount.isZero()
    ? null
    : cumulativeRefunds.equals(escrowAmount)
      ? "FULL"
      : "PARTIAL";

  return {
    resolutionOutcome: input.resolutionOutcome,
    items: itemRefunds,
    productRefundAmount: moneyString(productRefundAmount),
    deliveryFeeRefundAmount: moneyString(deliveryFeeRefundAmount),
    totalRefundAmount: moneyString(totalRefundAmount),
    originalOrderTotal: moneyString(orderTotal),
    alreadyRefundedAmount: moneyString(alreadyRefundedAmount),
    remainingEscrowBeforeRefund: moneyString(remainingBefore),
    remainingEscrowAfterRefund: moneyString(remainingAfter),
    refundType,
  };
}
