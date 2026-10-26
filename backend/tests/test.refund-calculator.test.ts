import { describe, expect, it } from "vitest";

import {
  DisputeItemOutcome,
  DisputeResolutionOutcome,
} from "../generated/prisma/client.js";

import { calculateDisputeRefund } from "../src/services/refund-calculation.service.js";

import type {
  CalculateDisputeRefundInput,
  RefundCalculationDisputeItem,
  RefundCalculationOrderItem,
} from "../src/services/refund-calculation.service.js";

function createInput(
  overrides: Partial<CalculateDisputeRefundInput> = {},
): CalculateDisputeRefundInput {
  return {
    resolutionOutcome: DisputeResolutionOutcome.PRODUCT_COMPENSATION,
    orderSubtotal: "200.00",
    orderDiscount: "20.00",
    deliveryFee: "10.00",
    orderTotal: "190.00",
    escrowAmount: "190.00",
    alreadyRefundedAmount: "0.00",
    orderItems: [
      {
        id: "item-1",
        quantity: 2,
        subtotal: "200.00",
        status: "ACTIVE",
      },
    ],
    disputeItems: [
      {
        id: "dispute-item-1",
        orderItemId: "item-1",
        claimedQuantity: 2,
        approvedQuantity: 1,
        outcome: DisputeItemOutcome.MODERATE_DEFECT,
      },
    ],
    ...overrides,
  };
}

function createOrderItem(
  overrides: Partial<RefundCalculationOrderItem> = {},
): RefundCalculationOrderItem {
  return {
    id: "item-1",
    quantity: 1,
    subtotal: "100.00",
    status: "ACTIVE",
    ...overrides,
  };
}

function createDisputeItem(
  overrides: Partial<RefundCalculationDisputeItem> = {},
): RefundCalculationDisputeItem {
  return {
    id: "dispute-item-1",
    orderItemId: "item-1",
    claimedQuantity: 1,
    approvedQuantity: 1,
    outcome: DisputeItemOutcome.MODERATE_DEFECT,
    ...overrides,
  };
}

describe("calculateDisputeRefund", () => {
  describe("standard refund calculations", () => {
    it("calculates a partial refund using approved quantity and defect rate", () => {
      const result = calculateDisputeRefund(createInput());

      expect(result.items[0]?.amount).toBe("22.50");
      expect(result.items[0]?.approvedQuantity).toBe(1);
      expect(result.items[0]?.rateBps).toBe(2500);
      expect(result.productRefundAmount).toBe("22.50");
      expect(result.deliveryFeeRefundAmount).toBe("0.00");
      expect(result.totalRefundAmount).toBe("22.50");
      expect(result.remainingEscrowBeforeRefund).toBe("190.00");
      expect(result.remainingEscrowAfterRefund).toBe("167.50");
      expect(result.refundType).toBe("PARTIAL");
    });

    it("does not refund delivery fees for delivered-order product disputes", () => {
      const result = calculateDisputeRefund(createInput());

      expect(result.deliveryFeeRefundAmount).toBe("0.00");
    });

    it("returns zero for a rejected dispute", () => {
      const result = calculateDisputeRefund(
        createInput({
          resolutionOutcome: DisputeResolutionOutcome.REJECTED,
        }),
      );

      expect(result.items[0]?.amount).toBe("0.00");
      expect(result.productRefundAmount).toBe("0.00");
      expect(result.deliveryFeeRefundAmount).toBe("0.00");
      expect(result.totalRefundAmount).toBe("0.00");
      expect(result.remainingEscrowAfterRefund).toBe("190.00");
      expect(result.refundType).toBeNull();
    });

    it("refunds all eligible item value and delivery fee for verified non-delivery", () => {
      const result = calculateDisputeRefund(
        createInput({
          resolutionOutcome:
            DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
          orderSubtotal: "300.00",
          orderDiscount: "30.00",
          deliveryFee: "20.00",
          orderTotal: "290.00",
          escrowAmount: "290.00",
          orderItems: [
            createOrderItem({
              id: "item-1",
              quantity: 1,
              subtotal: "100.00",
            }),
            createOrderItem({
              id: "item-2",
              quantity: 2,
              subtotal: "200.00",
            }),
          ],
          disputeItems: [
            createDisputeItem({
              id: "dispute-item-1",
              orderItemId: "item-1",
              claimedQuantity: 1,
              approvedQuantity: null,
              outcome: null,
            }),
            createDisputeItem({
              id: "dispute-item-2",
              orderItemId: "item-2",
              claimedQuantity: 2,
              approvedQuantity: null,
              outcome: null,
            }),
          ],
        }),
      );

      expect(result.items).toHaveLength(2);
      expect(result.productRefundAmount).toBe("270.00");
      expect(result.deliveryFeeRefundAmount).toBe("20.00");
      expect(result.totalRefundAmount).toBe("290.00");
      expect(result.remainingEscrowAfterRefund).toBe("0.00");
      expect(result.refundType).toBe("FULL");
    });

    it("rejects inconsistent order totals", () => {
      expect(() =>
        calculateDisputeRefund(createInput({ orderTotal: "200.00" })),
      ).toThrow();
    });

    it("rejects an approved quantity greater than the claimed quantity", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                claimedQuantity: 1,
                approvedQuantity: 2,
              }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects a refund that exceeds the remaining escrow", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({ alreadyRefundedAmount: "180.00" }),
        ),
      ).toThrow();
    });
  });

  describe("defect severity rates", () => {
    it.each([
      [DisputeItemOutcome.MINOR_DEFECT, 1000, "9.00"],
      [DisputeItemOutcome.MODERATE_DEFECT, 2500, "22.50"],
      [DisputeItemOutcome.MAJOR_DEFECT_OR_MISMATCH, 5000, "45.00"],
      [DisputeItemOutcome.UNUSABLE_OR_FUNDAMENTALLY_DIFFERENT, 10000, "90.00"],
      [DisputeItemOutcome.MISSING_ITEM, 10000, "90.00"],
    ] as const)(
      "applies the correct compensation rate for %s",
      (outcome, rateBps, expectedAmount) => {
        const result = calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                claimedQuantity: 2,
                approvedQuantity: 1,
                outcome,
              }),
            ],
          }),
        );

        expect(result.items[0]?.rateBps).toBe(rateBps);
        expect(result.items[0]?.amount).toBe(expectedAmount);
        expect(result.productRefundAmount).toBe(expectedAmount);
      },
    );

    it("does not compensate unapproved units", () => {
      const result = calculateDisputeRefund(
        createInput({
          disputeItems: [
            createDisputeItem({
              claimedQuantity: 2,
              approvedQuantity: 1,
              outcome: DisputeItemOutcome.UNUSABLE_OR_FUNDAMENTALLY_DIFFERENT,
            }),
          ],
        }),
      );

      expect(result.productRefundAmount).toBe("90.00");
    });

    it("rejects a rejected item claim with a positive approved quantity", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                approvedQuantity: 1,
                outcome: DisputeItemOutcome.REJECTED,
              }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects a compensable claim with zero approved quantity", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                approvedQuantity: 0,
                outcome: DisputeItemOutcome.MODERATE_DEFECT,
              }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects incomplete item decisions", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                approvedQuantity: null,
                outcome: null,
              }),
            ],
          }),
        ),
      ).toThrow();
    });
  });

  describe("multiple products and discount allocation", () => {
    it("allocates discounts proportionally across multiple products", () => {
      const result = calculateDisputeRefund(
        createInput({
          orderSubtotal: "300.00",
          orderDiscount: "30.00",
          deliveryFee: "20.00",
          orderTotal: "290.00",
          escrowAmount: "290.00",
          orderItems: [
            createOrderItem({
              id: "item-1",
              subtotal: "100.00",
            }),
            createOrderItem({
              id: "item-2",
              subtotal: "200.00",
            }),
          ],
          disputeItems: [
            createDisputeItem({
              id: "dispute-1",
              orderItemId: "item-1",
              outcome: DisputeItemOutcome.MINOR_DEFECT,
            }),
            createDisputeItem({
              id: "dispute-2",
              orderItemId: "item-2",
              outcome: DisputeItemOutcome.MAJOR_DEFECT_OR_MISMATCH,
            }),
          ],
        }),
      );

      // Item 1: 100 - 10 allocated discount = 90; 10% = 9.
      // Item 2: 200 - 20 allocated discount = 180; 50% = 90.
      expect(result.items[0]?.amount).toBe("9.00");
      expect(result.items[1]?.amount).toBe("90.00");
      expect(result.productRefundAmount).toBe("99.00");
      expect(result.totalRefundAmount).toBe("99.00");
      expect(result.remainingEscrowAfterRefund).toBe("191.00");
    });

    it("sums refunds for multiple disputed products without refunding other products", () => {
      const result = calculateDisputeRefund(
        createInput({
          orderSubtotal: "300.00",
          orderDiscount: "0.00",
          deliveryFee: "15.00",
          orderTotal: "315.00",
          escrowAmount: "315.00",
          orderItems: [
            createOrderItem({
              id: "item-1",
              subtotal: "100.00",
            }),
            createOrderItem({
              id: "item-2",
              subtotal: "100.00",
            }),
            createOrderItem({
              id: "item-3",
              subtotal: "100.00",
            }),
          ],
          disputeItems: [
            createDisputeItem({
              id: "claim-1",
              orderItemId: "item-1",
              outcome: DisputeItemOutcome.MINOR_DEFECT,
            }),
            createDisputeItem({
              id: "claim-2",
              orderItemId: "item-2",
              outcome: DisputeItemOutcome.MODERATE_DEFECT,
            }),
          ],
        }),
      );

      expect(result.items).toHaveLength(2);
      expect(result.productRefundAmount).toBe("35.00");
      expect(result.deliveryFeeRefundAmount).toBe("0.00");
      expect(result.totalRefundAmount).toBe("35.00");
    });

    it("applies discount allocation remainder deterministically", () => {
      const result = calculateDisputeRefund(
        createInput({
          orderSubtotal: "0.05",
          orderDiscount: "0.02",
          deliveryFee: "0.00",
          orderTotal: "0.03",
          escrowAmount: "0.03",
          orderItems: [
            createOrderItem({
              id: "item-a",
              subtotal: "0.02",
            }),
            createOrderItem({
              id: "item-b",
              subtotal: "0.03",
            }),
          ],
          disputeItems: [
            createDisputeItem({
              id: "claim-a",
              orderItemId: "item-a",
              outcome: DisputeItemOutcome.UNUSABLE_OR_FUNDAMENTALLY_DIFFERENT,
            }),
            createDisputeItem({
              id: "claim-b",
              orderItemId: "item-b",
              outcome: DisputeItemOutcome.UNUSABLE_OR_FUNDAMENTALLY_DIFFERENT,
            }),
          ],
        }),
      );

      // Allocations round to 0.01 and 0.01; the remaining 0.01
      // is assigned to the largest item, item-b.
      expect(result.items[0]?.amount).toBe("0.01");
      expect(result.items[1]?.amount).toBe("0.02");
      expect(result.productRefundAmount).toBe("0.03");
      expect(result.remainingEscrowAfterRefund).toBe("0.00");
    });

    it("rejects product compensation when no disputed items are supplied", () => {
      expect(() =>
        calculateDisputeRefund(createInput({ disputeItems: [] })),
      ).toThrow();
    });
  });

  describe("previous refunds and escrow boundaries", () => {
    it("uses previous refunds when calculating the remaining escrow", () => {
      const result = calculateDisputeRefund(
        createInput({
          alreadyRefundedAmount: "50.00",
        }),
      );

      expect(result.alreadyRefundedAmount).toBe("50.00");
      expect(result.remainingEscrowBeforeRefund).toBe("140.00");
      expect(result.remainingEscrowAfterRefund).toBe("117.50");
      expect(result.totalRefundAmount).toBe("22.50");
      expect(result.refundType).toBe("PARTIAL");
    });

    it("classifies the current refund as FULL when cumulative refunds exhaust escrow", () => {
      const result = calculateDisputeRefund(
        createInput({
          alreadyRefundedAmount: "167.50",
        }),
      );

      expect(result.totalRefundAmount).toBe("22.50");
      expect(result.remainingEscrowBeforeRefund).toBe("22.50");
      expect(result.remainingEscrowAfterRefund).toBe("0.00");
      expect(result.refundType).toBe("FULL");
    });

    it("rejects previous refunds greater than the original escrow", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({ alreadyRefundedAmount: "190.01" }),
        ),
      ).toThrow();
    });

    it("accepts a refund that exactly equals the remaining escrow", () => {
      const result = calculateDisputeRefund(
        createInput({
          alreadyRefundedAmount: "167.50",
        }),
      );

      expect(result.totalRefundAmount).toBe("22.50");
      expect(result.remainingEscrowAfterRefund).toBe("0.00");
      expect(result.refundType).toBe("FULL");
    });
  });

  describe("non-delivery validation", () => {
    it("rejects non-delivery claims that omit an order item", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            resolutionOutcome:
              DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
            disputeItems: [],
          }),
        ),
      ).toThrow();
    });

    it("rejects non-delivery claims with incomplete quantities", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            resolutionOutcome:
              DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
            disputeItems: [
              createDisputeItem({
                claimedQuantity: 1,
              }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects non-delivery claims for inactive order items", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            resolutionOutcome:
              DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
            orderItems: [createOrderItem({ status: "CANCELLED" })],
          }),
        ),
      ).toThrow();
    });

    it("refunds the delivery fee only for the non-delivery outcome", () => {
      const result = calculateDisputeRefund(
        createInput({
          resolutionOutcome:
            DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
          orderSubtotal: "100.00",
          orderDiscount: "0.00",
          deliveryFee: "10.00",
          orderTotal: "110.00",
          escrowAmount: "110.00",
          orderItems: [
            createOrderItem({
              quantity: 1,
              subtotal: "100.00",
            }),
          ],
          disputeItems: [
            createDisputeItem({
              claimedQuantity: 1,
              approvedQuantity: null,
              outcome: null,
            }),
          ],
        }),
      );

      expect(result.productRefundAmount).toBe("100.00");
      expect(result.deliveryFeeRefundAmount).toBe("10.00");
      expect(result.totalRefundAmount).toBe("110.00");
      expect(result.refundType).toBe("FULL");
    });
  });

  describe("input and order integrity", () => {
    it.each(["not-a-number", "NaN", "Infinity", "-1.00"])(
      "rejects invalid monetary input: %s",
      (amount) => {
        expect(() =>
          calculateDisputeRefund(createInput({ orderDiscount: amount })),
        ).toThrow();
      },
    );

    it("rejects a discount greater than the order subtotal", () => {
      expect(() =>
        calculateDisputeRefund(createInput({ orderDiscount: "201.00" })),
      ).toThrow();
    });

    it("rejects an escrow amount that differs from the order total", () => {
      expect(() =>
        calculateDisputeRefund(createInput({ escrowAmount: "189.99" })),
      ).toThrow();
    });

    it("rejects an order subtotal that differs from the item subtotals", () => {
      expect(() =>
        calculateDisputeRefund(createInput({ orderSubtotal: "199.99" })),
      ).toThrow();
    });

    it("rejects an order with no items", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            orderItems: [],
            disputeItems: [],
          }),
        ),
      ).toThrow();
    });

    it("rejects duplicate order item IDs", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            orderItems: [
              createOrderItem({ id: "duplicate" }),
              createOrderItem({ id: "duplicate" }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects invalid purchased quantities", () => {
      for (const quantity of [
        0,
        -1,
        1.5,
        Number.NaN,
        Number.MAX_SAFE_INTEGER + 1,
      ]) {
        expect(() =>
          calculateDisputeRefund(
            createInput({
              orderItems: [
                createOrderItem({
                  quantity,
                  subtotal: "200.00",
                }),
              ],
            }),
          ),
        ).toThrow();
      }
    });

    it("rejects duplicate disputed order item references", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({ id: "claim-1" }),
              createDisputeItem({ id: "claim-2" }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects a disputed item that does not belong to the order", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                orderItemId: "another-order-item",
              }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects fractional claimed and approved quantities", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                claimedQuantity: 1.5,
              }),
            ],
          }),
        ),
      ).toThrow();

      expect(() =>
        calculateDisputeRefund(
          createInput({
            disputeItems: [
              createDisputeItem({
                approvedQuantity: 0.5,
              }),
            ],
          }),
        ),
      ).toThrow();
    });

    it("rejects product compensation for an inactive order item", () => {
      expect(() =>
        calculateDisputeRefund(
          createInput({
            orderItems: [
              createOrderItem({
                quantity: 2,
                subtotal: "200.00",
                status: "CANCELLED",
              }),
            ],
          }),
        ),
      ).toThrow();
    });
  });

  describe("currency precision", () => {
    it("rounds a half-cent compensation to two decimal places", () => {
      const result = calculateDisputeRefund(
        createInput({
          orderSubtotal: "0.05",
          orderDiscount: "0.00",
          deliveryFee: "0.00",
          orderTotal: "0.05",
          escrowAmount: "0.05",
          orderItems: [
            createOrderItem({
              quantity: 1,
              subtotal: "0.05",
            }),
          ],
          disputeItems: [
            createDisputeItem({
              outcome: DisputeItemOutcome.MINOR_DEFECT,
            }),
          ],
        }),
      );

      expect(result.items[0]?.amount).toBe("0.01");
      expect(result.productRefundAmount).toBe("0.01");
      expect(result.totalRefundAmount).toBe("0.01");
      expect(result.remainingEscrowAfterRefund).toBe("0.04");
    });

    it("returns monetary values consistently formatted to two decimal places", () => {
      const result = calculateDisputeRefund(createInput());

      expect(result.productRefundAmount).toMatch(/^\d+\.\d{2}$/);
      expect(result.deliveryFeeRefundAmount).toMatch(/^\d+\.\d{2}$/);
      expect(result.totalRefundAmount).toMatch(/^\d+\.\d{2}$/);
      expect(result.originalOrderTotal).toMatch(/^\d+\.\d{2}$/);
      expect(result.alreadyRefundedAmount).toMatch(/^\d+\.\d{2}$/);
      expect(result.remainingEscrowBeforeRefund).toMatch(/^\d+\.\d{2}$/);
      expect(result.remainingEscrowAfterRefund).toMatch(/^\d+\.\d{2}$/);
    });
  });
});
