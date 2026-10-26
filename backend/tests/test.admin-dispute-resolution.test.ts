import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DisputeItemOutcome,
  DisputeResolutionOutcome,
  DisputeStatus,
  Prisma,
} from "../generated/prisma/client.js";

const mocks = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
  calculateDisputeRefund: vi.fn(),
  releaseOrderStock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../src/services/refund-calculation.service.js", () => ({
  calculateDisputeRefund: mocks.calculateDisputeRefund,
}));

vi.mock("../src/services/order-stock.service.js", () => ({
  releaseOrderStock: mocks.releaseOrderStock,
}));

import { resolveDispute } from "../src/services/admin/admin-dispute-resolution.service.js";

const D = (value: string | number) => new Prisma.Decimal(value);

const IDS = {
  dispute: "dispute-1",
  order: "order-1",
  escrow: "escrow-1",
  buyer: "buyer-1",
  seller: "seller-1",
  admin: "admin-1",
  wallet: "wallet-1",
  orderItem: "order-item-1",
  disputeItem: "dispute-item-1",
  refund: "refund-1",
  ledger: "ledger-1",
};

function makeDispute(overrides: Record<string, any> = {}) {
  const orderItem = {
    id: IDS.orderItem,
    quantity: 2,
    subtotal: D(90),
    status: "ACTIVE",
    productId: "product-1",
    productVariantId: null,
    variant: null,
    ...overrides.orderItem,
  };

  const disputeItem = {
    id: IDS.disputeItem,
    orderItemId: IDS.orderItem,
    claimedQuantity: 2,
    approvedQuantity: 0,
    outcome: null,
    orderItem,
    ...overrides.disputeItem,
  };

  const order = {
    id: IDS.order,
    userId: IDS.buyer,
    status: "DELIVERED",
    paymentStatus: "PAID",
    subtotal: D(90),
    discount: D(0),
    deliveryFee: D(10),
    total: D(100),
    cancellationReason: null,
    items: [orderItem],
    store: { ownerId: IDS.seller },
    ...overrides.order,
  };

  const escrow = {
    id: IDS.escrow,
    orderId: IDS.order,
    buyerId: IDS.buyer,
    sellerId: IDS.seller,
    status: "DISPUTED",
    amount: D(100),
    currency: "NGN",
    refundedAmount: D(0),
    refundedAt: null,
    refundReason: null,
    releasedAt: null,
    ...overrides.escrow,
  };

  return {
    id: IDS.dispute,
    orderId: IDS.order,
    escrowId: IDS.escrow,
    buyerId: IDS.buyer,
    sellerId: IDS.seller,
    status: overrides.status ?? DisputeStatus.UNDER_REVIEW,
    reason: overrides.reason ?? "PRODUCT_NOT_AS_DESCRIBED",
    order,
    escrow,
    items: overrides.items ?? [disputeItem],
    ...overrides.dispute,
  };
}

function makeCalculation(overrides: Record<string, any> = {}) {
  return {
    totalRefundAmount: D(20),
    productRefundAmount: "20.00",
    deliveryFeeRefundAmount: "0.00",
    refundType: "PARTIAL",
    items: [
      {
        disputeItemId: IDS.disputeItem,
        orderItemId: IDS.orderItem,
        approvedQuantity: 1,
        outcome: DisputeItemOutcome.MODERATE_DEFECT,
        rateBps: 2500,
        amount: D(20),
      },
    ],
    ...overrides,
  };
}

function makeTx(dispute = makeDispute()) {
  const tx: Record<string, any> = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: "locked-row" }]),
    dispute: {
      findUnique: vi.fn(),
      update: vi
        .fn()
        .mockImplementation(
          async ({ data }: { data: Record<string, any> }) => ({
            id: IDS.dispute,
            orderId: IDS.order,
            buyerId: IDS.buyer,
            sellerId: IDS.seller,
            status: "PARTIALLY_RESOLVED",
            resolutionOutcome: DisputeResolutionOutcome.PRODUCT_COMPENSATION,
            approvedRefundAmount: D(20),
            resolvedAt: new Date("2026-01-01T00:00:00.000Z"),
            ...data,
          }),
        ),
    },
    refund: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: D(0) } }),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: IDS.refund }),
      update: vi.fn().mockResolvedValue({ id: IDS.refund }),
    },
    wallet: {
      findUnique: vi
        .fn()
        .mockResolvedValueOnce({ id: IDS.wallet })
        .mockResolvedValueOnce({
          id: IDS.wallet,
          userId: IDS.buyer,
          isActive: true,
          currency: "NGN",
          availableBalance: D(50),
          heldBalance: D(100),
        }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    walletLedger: {
      create: vi.fn().mockResolvedValue({ id: IDS.ledger }),
    },
    disputeItem: {
      update: vi.fn().mockResolvedValue({}),
    },
    escrow: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    order: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" }),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: "notification-1" }),
    },
  };

  tx.dispute.findUnique
    .mockResolvedValueOnce({ orderId: IDS.order })
    .mockResolvedValueOnce({ orderId: IDS.order, escrowId: IDS.escrow })
    .mockResolvedValueOnce(dispute);

  return tx;
}

function arrangeTransaction(dispute = makeDispute()) {
  const tx = makeTx(dispute);
  mocks.prisma.$transaction.mockImplementation(
    async (callback: (tx: any) => unknown) => callback(tx),
  );
  return tx;
}

function validInput(
  overrides: Partial<{
    disputeId: string;
    adminId: string;
    outcome: DisputeResolutionOutcome;
    resolutionNote: string;
    itemDecisions: {
      disputeItemId: string;
      outcome: DisputeItemOutcome;
      approvedQuantity: number;
    }[];
  }> = {},
) {
  return {
    disputeId: IDS.dispute,
    adminId: IDS.admin,
    outcome: DisputeResolutionOutcome.PRODUCT_COMPENSATION,
    resolutionNote: "Verified claim and approved partial compensation.",
    itemDecisions: [
      {
        disputeItemId: IDS.disputeItem,
        outcome: DisputeItemOutcome.MODERATE_DEFECT,
        approvedQuantity: 1,
      },
    ],
    ...overrides,
  };
}

describe("resolveDispute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it.each([
      [
        { disputeId: " ", adminId: IDS.admin },
        "DISPUTE_RESOLUTION_INPUT_INVALID",
      ],
      [
        { disputeId: IDS.dispute, adminId: " " },
        "DISPUTE_RESOLUTION_INPUT_INVALID",
      ],
      [{ resolutionNote: " " }, "DISPUTE_RESOLUTION_NOTE_REQUIRED"],
      [{ resolutionNote: "four" }, "DISPUTE_RESOLUTION_NOTE_REQUIRED"],
      [
        { resolutionNote: "x".repeat(5001) },
        "DISPUTE_RESOLUTION_NOTE_TOO_LONG",
      ],
      [
        {
          itemDecisions: [
            {
              disputeItemId: " ",
              outcome: DisputeItemOutcome.REJECTED,
              approvedQuantity: 0,
            },
          ],
        },
        "DISPUTE_ITEM_DECISION_INVALID",
      ],
      [
        {
          itemDecisions: [
            {
              disputeItemId: IDS.disputeItem,
              outcome: DisputeItemOutcome.REJECTED,
              approvedQuantity: 0,
            },
            {
              disputeItemId: IDS.disputeItem,
              outcome: DisputeItemOutcome.REJECTED,
              approvedQuantity: 0,
            },
          ],
        },
        "DUPLICATE_DISPUTE_ITEM_DECISION",
      ],
      [
        {
          itemDecisions: [
            {
              disputeItemId: IDS.disputeItem,
              outcome: DisputeItemOutcome.REJECTED,
              approvedQuantity: 1.5,
            },
          ],
        },
        "DISPUTE_APPROVED_QUANTITY_INVALID",
      ],
      [
        {
          itemDecisions: [
            {
              disputeItemId: IDS.disputeItem,
              outcome: DisputeItemOutcome.REJECTED,
              approvedQuantity: -1,
            },
          ],
        },
        "DISPUTE_APPROVED_QUANTITY_INVALID",
      ],
    ])(
      "rejects invalid input before opening a transaction: %j",
      async (overrides, code) => {
        await expect(
          resolveDispute(validInput(overrides as any)),
        ).rejects.toMatchObject({
          code,
        });
        expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
      },
    );
  });

  it("rejects when the dispute does not exist", async () => {
    const tx = makeTx();
    tx.dispute.findUnique.mockReset().mockResolvedValueOnce(null);
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: any) => unknown) => callback(tx),
    );

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "DISPUTE_NOT_FOUND",
    });
  });

  it("rejects disputes that are not under review", async () => {
    const dispute = makeDispute({ status: DisputeStatus.OPEN });
    arrangeTransaction(dispute);

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "DISPUTE_NOT_UNDER_REVIEW",
    });
  });

  it("rejects when escrow is not DISPUTED", async () => {
    arrangeTransaction(makeDispute({ escrow: { status: "HELD" } }));

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "DISPUTE_ESCROW_STATE_INVALID",
    });
  });

  it("rejects mismatched order, escrow, buyer, or seller associations", async () => {
    arrangeTransaction(makeDispute({ order: { userId: "someone-else" } }));

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "DISPUTE_FINANCIAL_RECORD_MISMATCH",
    });
  });

  it("rejects an escrow amount that differs from the order total", async () => {
    arrangeTransaction(makeDispute({ escrow: { amount: D(99) } }));

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "ESCROW_AMOUNT_MISMATCH",
    });
  });

  it("rejects an escrow that was released or has an ineligible payment status", async () => {
    arrangeTransaction(makeDispute({ escrow: { releasedAt: new Date() } }));

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "DISPUTE_ESCROW_NOT_REFUNDABLE",
    });
  });

  it("rejects product compensation for an undelivered order", async () => {
    arrangeTransaction(makeDispute({ order: { status: "IN_DELIVERY" } }));

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "PRODUCT_COMPENSATION_NOT_ALLOWED",
    });
  });

  it("requires a decision for every disputed item for product compensation", async () => {
    arrangeTransaction(makeDispute());

    await expect(
      resolveDispute(validInput({ itemDecisions: [] })),
    ).rejects.toMatchObject({ code: "DISPUTE_ITEM_DECISIONS_INCOMPLETE" });
  });

  it("rejects decisions for items not belonging to this dispute", async () => {
    arrangeTransaction(makeDispute());

    await expect(
      resolveDispute(
        validInput({
          itemDecisions: [
            {
              disputeItemId: "another-dispute-item",
              outcome: DisputeItemOutcome.MODERATE_DEFECT,
              approvedQuantity: 1,
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "DISPUTE_ITEM_DECISION_MISMATCH" });
  });

  it("rejects approved quantities greater than the claimed quantity", async () => {
    arrangeTransaction(makeDispute());

    await expect(
      resolveDispute(
        validInput({
          itemDecisions: [
            {
              disputeItemId: IDS.disputeItem,
              outcome: DisputeItemOutcome.MODERATE_DEFECT,
              approvedQuantity: 3,
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      code: "DISPUTE_APPROVED_QUANTITY_EXCEEDS_CLAIM",
    });
  });

  it("rejects rejected item decisions with a non-zero approved quantity", async () => {
    arrangeTransaction(makeDispute());

    await expect(
      resolveDispute(
        validInput({
          itemDecisions: [
            {
              disputeItemId: IDS.disputeItem,
              outcome: DisputeItemOutcome.REJECTED,
              approvedQuantity: 1,
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "DISPUTE_REJECTED_QUANTITY_INVALID" });
  });

  it("rejects non-rejected item decisions with zero approved quantity", async () => {
    arrangeTransaction(makeDispute());

    await expect(
      resolveDispute(
        validInput({
          itemDecisions: [
            {
              disputeItemId: IDS.disputeItem,
              outcome: DisputeItemOutcome.MODERATE_DEFECT,
              approvedQuantity: 0,
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "DISPUTE_APPROVED_QUANTITY_REQUIRED" });
  });

  it("applies a product-compensation refund to the buyer wallet and records the resolution", async () => {
    const tx = arrangeTransaction(makeDispute());
    mocks.calculateDisputeRefund.mockReturnValue(makeCalculation());

    const result = await resolveDispute(validInput());

    expect(mocks.calculateDisputeRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        resolutionOutcome: DisputeResolutionOutcome.PRODUCT_COMPENSATION,
        orderSubtotal: D(90),
        orderDiscount: D(0),
        deliveryFee: D(10),
        orderTotal: D(100),
        escrowAmount: D(100),
        alreadyRefundedAmount: D(0),
        disputeItems: [
          expect.objectContaining({
            id: IDS.disputeItem,
            approvedQuantity: 1,
            outcome: DisputeItemOutcome.MODERATE_DEFECT,
          }),
        ],
      }),
    );

    expect(tx.refund.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: IDS.order,
          escrowId: IDS.escrow,
          userId: IDS.buyer,
          status: "COMPLETED",
          amount: D(20),
          currency: "NGN",
          idempotencyKey: `dispute:${IDS.dispute}:resolution-refund`,
        }),
      }),
    );

    expect(tx.wallet.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: IDS.wallet,
          isActive: true,
          heldBalance: { gte: D(20) },
        }),
        data: {
          heldBalance: { decrement: D(20) },
          availableBalance: { increment: D(20) },
        },
      }),
    );

    expect(tx.walletLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          walletId: IDS.wallet,
          type: "REFUND",
          status: "COMPLETED",
          amount: D(20),
          refundId: IDS.refund,
          idempotencyKey: `dispute:${IDS.dispute}:resolution-refund-ledger`,
        }),
      }),
    );

    expect(tx.refund.update).toHaveBeenCalledWith({
      where: { id: IDS.refund },
      data: { walletLedgerId: IDS.ledger },
    });

    expect(tx.disputeItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: IDS.disputeItem },
        data: expect.objectContaining({
          outcome: DisputeItemOutcome.MODERATE_DEFECT,
          approvedQuantity: 1,
          calculatedRefundAmount: D(20),
        }),
      }),
    );

    expect(tx.escrow.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: IDS.escrow,
          status: "DISPUTED",
          releasedAt: null,
        }),
        data: expect.objectContaining({
          status: "PARTIALLY_REFUNDED",
          refundedAmount: D(20),
        }),
      }),
    );

    expect(tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: IDS.order, paymentStatus: "PAID" },
        data: { paymentStatus: "PARTIALLY_REFUNDED" },
      }),
    );

    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: "ADMIN",
          actorId: IDS.admin,
          disputeId: IDS.dispute,
          action: "DISPUTE_RESOLVED",
          refundId: IDS.refund,
        }),
      }),
    );

    expect(tx.notification.create).toHaveBeenCalledTimes(2);
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: IDS.buyer,
          type: "DISPUTE_RESOLVED",
          dedupeKey: `dispute-resolution:${IDS.dispute}:buyer`,
        }),
      }),
    );
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: IDS.seller,
          type: "DISPUTE_RESOLVED",
          dedupeKey: `dispute-resolution:${IDS.dispute}:seller`,
        }),
      }),
    );

    expect(result.refund).toMatchObject({
      amount: "20.00",
      currency: "NGN",
      refundId: IDS.refund,
      cumulativeRefundAmount: "20.00",
      remainingEscrowAmount: "80.00",
    });
    expect(result.escrow).toMatchObject({
      id: IDS.escrow,
      status: "PARTIALLY_REFUNDED",
      refundedAmount: "20.00",
    });
  });

  it("resolves a rejected dispute without creating a refund or crediting the wallet", async () => {
    const tx = arrangeTransaction(makeDispute());
    mocks.calculateDisputeRefund.mockReturnValue(
      makeCalculation({
        totalRefundAmount: D(0),
        productRefundAmount: "0.00",
        deliveryFeeRefundAmount: "0.00",
        refundType: "PARTIAL",
        items: [
          {
            disputeItemId: IDS.disputeItem,
            orderItemId: IDS.orderItem,
            approvedQuantity: 0,
            outcome: DisputeItemOutcome.REJECTED,
            rateBps: 0,
            amount: D(0),
          },
        ],
      }),
    );

    const result = await resolveDispute(
      validInput({
        outcome: DisputeResolutionOutcome.REJECTED,
        itemDecisions: [],
      }),
    );

    expect(mocks.calculateDisputeRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        resolutionOutcome: DisputeResolutionOutcome.REJECTED,
        disputeItems: [
          expect.objectContaining({
            approvedQuantity: 0,
            outcome: DisputeItemOutcome.REJECTED,
          }),
        ],
      }),
    );
    expect(tx.refund.create).not.toHaveBeenCalled();
    expect(tx.wallet.updateMany).not.toHaveBeenCalled();
    expect(tx.walletLedger.create).not.toHaveBeenCalled();
    expect(tx.disputeItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: IDS.disputeItem },
        data: expect.objectContaining({
          outcome: DisputeItemOutcome.REJECTED,
          approvedQuantity: 0,
          calculatedRefundAmount: D(0),
        }),
      }),
    );
    expect(tx.escrow.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "HELD",
          refundedAmount: D(0),
        }),
      }),
    );
    expect(tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { paymentStatus: "PAID" },
      }),
    );
    expect(result.refund).toMatchObject({
      amount: "0.00",
      refundId: null,
      cumulativeRefundAmount: "0.00",
      remainingEscrowAmount: "100.00",
    });
  });

  it("requires every order item to be fully claimed for non-delivery resolution", async () => {
    const dispute = makeDispute({
      reason: "NON_DELIVERY",
      order: { status: "IN_DELIVERY" },
      items: [
        {
          id: IDS.disputeItem,
          orderItemId: IDS.orderItem,
          claimedQuantity: 1,
          approvedQuantity: 0,
          outcome: null,
          orderItem: {
            id: IDS.orderItem,
            quantity: 2,
            subtotal: D(90),
            status: "ACTIVE",
          },
        },
      ],
    });
    arrangeTransaction(dispute);

    await expect(
      resolveDispute(
        validInput({
          outcome: DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
          itemDecisions: [],
        }),
      ),
    ).rejects.toMatchObject({ code: "NON_DELIVERY_ITEMS_INCOMPLETE" });
  });

  it("restores reserved product/variant stock when seller-responsible non-delivery cancels the order", async () => {
    const dispute = makeDispute({
      reason: "NON_DELIVERY",
      order: { status: "IN_DELIVERY" },
    });
    const tx = arrangeTransaction(dispute);
    mocks.calculateDisputeRefund.mockReturnValue(
      makeCalculation({
        totalRefundAmount: D(100),
        productRefundAmount: "90.00",
        deliveryFeeRefundAmount: "10.00",
        refundType: "FULL",
        items: [
          {
            disputeItemId: IDS.disputeItem,
            orderItemId: IDS.orderItem,
            approvedQuantity: 2,
            outcome: DisputeItemOutcome.MISSING_ITEM,
            rateBps: 10000,
            amount: D(90),
          },
        ],
      }),
    );

    await resolveDispute(
      validInput({
        outcome: DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
        itemDecisions: [],
      }),
    );

    expect(mocks.releaseOrderStock).toHaveBeenCalledTimes(1);
    expect(mocks.releaseOrderStock).toHaveBeenCalledWith(tx, [
      {
        productId: "product-1",
        quantity: 2,
        variant: null,
      },
    ]);
    expect(tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
  });

  it("cancels an eligible non-delivery order and requests the full refund calculation", async () => {
    const dispute = makeDispute({
      reason: "NON_DELIVERY",
      order: { status: "IN_DELIVERY" },
    });
    const tx = arrangeTransaction(dispute);
    mocks.calculateDisputeRefund.mockReturnValue(
      makeCalculation({
        totalRefundAmount: D(100),
        productRefundAmount: "90.00",
        deliveryFeeRefundAmount: "10.00",
        refundType: "FULL",
        items: [
          {
            disputeItemId: IDS.disputeItem,
            orderItemId: IDS.orderItem,
            approvedQuantity: 2,
            outcome: DisputeItemOutcome.MISSING_ITEM,
            rateBps: 10000,
            amount: D(90),
          },
        ],
      }),
    );

    const result = await resolveDispute(
      validInput({
        outcome: DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
        itemDecisions: [],
      }),
    );

    expect(mocks.calculateDisputeRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        resolutionOutcome:
          DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
      }),
    );
    expect(tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
          cancellationReason: expect.stringContaining(IDS.dispute),
        }),
      }),
    );
    expect(tx.escrow.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REFUNDED",
          refundedAmount: D(100),
        }),
      }),
    );
    expect(result.dispute.status).toBe("RESOLVED_BUYER");
    expect(result.refund).toMatchObject({
      amount: "100.00",
      productRefundAmount: "90.00",
      deliveryFeeRefundAmount: "10.00",
      remainingEscrowAmount: "0.00",
    });
  });

  it("fails safely if the buyer wallet is missing", async () => {
    const tx = arrangeTransaction(makeDispute());
    tx.wallet.findUnique.mockReset().mockResolvedValueOnce(null);
    mocks.calculateDisputeRefund.mockReturnValue(makeCalculation());

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "BUYER_WALLET_UNAVAILABLE",
    });

    expect(tx.refund.create).not.toHaveBeenCalled();
    expect(tx.escrow.updateMany).not.toHaveBeenCalled();
    expect(tx.order.updateMany).not.toHaveBeenCalled();
  });

  it("fails safely if the buyer's held balance is insufficient", async () => {
    const tx = arrangeTransaction(makeDispute());
    tx.wallet.findUnique
      .mockReset()
      .mockResolvedValueOnce({ id: IDS.wallet })
      .mockResolvedValueOnce({
        id: IDS.wallet,
        isActive: true,
        currency: "NGN",
        availableBalance: D(50),
        heldBalance: D(5),
      });
    mocks.calculateDisputeRefund.mockReturnValue(makeCalculation());

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "REFUND_HELD_BALANCE_INSUFFICIENT",
    });

    expect(tx.refund.create).not.toHaveBeenCalled();
    expect(tx.escrow.updateMany).not.toHaveBeenCalled();
    expect(tx.order.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a refund when completed refund records disagree with escrow.refundedAmount", async () => {
    const tx = arrangeTransaction(
      makeDispute({ escrow: { refundedAmount: D(5) } }),
    );
    tx.refund.aggregate.mockResolvedValue({ _sum: { amount: D(0) } });

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "ESCROW_REFUND_TOTAL_MISMATCH",
    });

    expect(mocks.calculateDisputeRefund).not.toHaveBeenCalled();
    expect(tx.refund.create).not.toHaveBeenCalled();
  });

  it("rejects a calculated refund that exceeds the escrow amount", async () => {
    const tx = arrangeTransaction(makeDispute());
    mocks.calculateDisputeRefund.mockReturnValue(
      makeCalculation({ totalRefundAmount: D(101) }),
    );

    await expect(resolveDispute(validInput())).rejects.toMatchObject({
      code: "REFUND_EXCEEDS_ESCROW",
    });

    expect(tx.refund.create).not.toHaveBeenCalled();
    expect(tx.escrow.updateMany).not.toHaveBeenCalled();
    expect(tx.order.updateMany).not.toHaveBeenCalled();
  });

  it("uses Serializable isolation and the configured transaction limits", async () => {
    arrangeTransaction(makeDispute());
    mocks.calculateDisputeRefund.mockReturnValue(makeCalculation());

    await resolveDispute(validInput());

    expect(mocks.prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  });
});
