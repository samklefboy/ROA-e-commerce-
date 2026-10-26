import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { prismaMock, commissionPolicyMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
  commissionPolicyMock: vi.fn(),
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../src/services/commission-policy.service.js", () => ({
  getGlobalCommissionPolicy: commissionPolicyMock,
}));

import { releaseEscrow } from "../src/services/escrow-release.service.js";

const D = (value: string | number) => new Prisma.Decimal(value);

const ORDER_ID = "order-1";
const ESCROW_ID = "escrow-1";
const BUYER_ID = "buyer-1";
const SELLER_ID = "seller-1";
const PLATFORM_WALLET_ID = "platform-wallet-1";

function makeWallet(overrides: Record<string, unknown> = {}) {
  return {
    id: "wallet-1",
    userId: "user-1",
    currency: "NGN",
    isActive: true,
    availableBalance: D(0),
    heldBalance: D(0),
    ...overrides,
  };
}

function makeEscrow(overrides: Record<string, any> = {}) {
  const deliveredAt = new Date("2026-10-10T10:00:00.000Z");
  const releaseEligibleAt = new Date(
    deliveredAt.getTime() + 36 * 60 * 60 * 1000,
  );

  return {
    id: ESCROW_ID,
    orderId: ORDER_ID,
    buyerId: BUYER_ID,
    sellerId: SELLER_ID,
    amount: D(1000),
    refundedAmount: D(0),
    releasedAmount: null,
    currency: "NGN",
    status: "HELD",
    heldAt: new Date("2026-10-09T10:00:00.000Z"),
    releasedAt: null,
    releaseEligibleAt,
    releaseReason: null,
    metadata: {},
    order: {
      id: ORDER_ID,
      userId: BUYER_ID,
      total: D(1000),
      currency: "NGN",
      status: "DELIVERED",
      paymentStatus: "PAID",
      deliveredAt,
      store: {
        id: "store-1",
        ownerId: SELLER_ID,
      },
      deliveryEvidence: [],
      tracking: [
        {
          note: "Buyer confirmed receipt.",
          createdAt: deliveredAt,
        },
      ],
    },
    ...overrides,
  };
}

function makeHarness(
  options: {
    escrow?: Record<string, any>;
    escrowLocator?: Record<string, any> | null;
    completedRefunds?: string | number;
    disputeLocator?: Record<string, any> | null;
    activeDispute?: Record<string, any> | null;
    commissionRateBps?: number;
    buyerWallet?: Record<string, any> | null;
    sellerWallet?: Record<string, any> | null;
    platformWallet?: Record<string, any> | null;
    claimCount?: number;
    buyerDebitCount?: number;
    sellerCreditCount?: number;
    platformCreditCount?: number;
  } = {},
) {
  const escrow = makeEscrow(options.escrow ?? {});

  const locator =
    options.escrowLocator === undefined
      ? { id: ESCROW_ID, orderId: ORDER_ID }
      : options.escrowLocator;

  // Keep a concrete wallet for mock bookkeeping, but return null from
  // the database lookup when the test explicitly requests a missing wallet.
  const buyerWallet = makeWallet({
    id: "buyer-wallet-1",
    userId: BUYER_ID,
    availableBalance: D(0),
    heldBalance: D(1000),
    ...(options.buyerWallet ?? {}),
  });

  const buyerWalletResult = options.buyerWallet === null ? null : buyerWallet;

  const sellerWallet = makeWallet({
    id: "seller-wallet-1",
    userId: SELLER_ID,
    availableBalance: D(100),
    heldBalance: D(0),
    ...(options.sellerWallet ?? {}),
  });

  const platformWallet = makeWallet({
    id: PLATFORM_WALLET_ID,
    userId: null,
    ownerType: "PLATFORM",
    availableBalance: D(500),
    heldBalance: D(0),
    ...(options.platformWallet ?? {}),
  });

  const tx: any = {
    escrow: {
      findUnique: vi.fn(async (args: any) => {
        if (args.select) return locator;
        return escrow;
      }),

      updateMany: vi.fn(async () => ({
        count: options.claimCount ?? 1,
      })),

      update: vi.fn(async () => ({
        ...escrow,
        status: "RELEASED",
      })),
    },

    dispute: {
      findUnique: vi.fn(async (args: any) => {
        if (args.select?.status) {
          return options.activeDispute ?? null;
        }

        return options.disputeLocator ?? null;
      }),
    },

    refund: {
      aggregate: vi.fn(async () => ({
        _sum: {
          amount: D(options.completedRefunds ?? 0),
        },
      })),
    },

    wallet: {
      findUnique: vi.fn(async (args: any) => {
        if (args.where.userId === BUYER_ID) {
          return buyerWalletResult;
        }

        if (args.where.userId === SELLER_ID) {
          return sellerWallet;
        }

        return null;
      }),

      findFirst: vi.fn(async () =>
        options.platformWallet === null ? null : platformWallet,
      ),

      updateMany: vi.fn(async (args: any) => {
        const id = args.where.id;

        if (id === buyerWallet.id) {
          if (options.buyerDebitCount === 0) {
            return { count: 0 };
          }

          const amount = args.data.heldBalance?.decrement;

          if (amount !== undefined) {
            buyerWallet.heldBalance = buyerWallet.heldBalance.minus(amount);
          }

          return { count: 1 };
        }

        if (id === sellerWallet.id) {
          if (options.sellerCreditCount === 0) {
            return { count: 0 };
          }

          const amount = args.data.availableBalance?.increment;

          if (amount !== undefined) {
            sellerWallet.availableBalance =
              sellerWallet.availableBalance.plus(amount);
          }

          return { count: 1 };
        }

        if (id === platformWallet.id) {
          if (options.platformCreditCount === 0) {
            return { count: 0 };
          }

          const amount = args.data.availableBalance?.increment;

          if (amount !== undefined) {
            platformWallet.availableBalance =
              platformWallet.availableBalance.plus(amount);
          }

          return { count: 1 };
        }

        return { count: 0 };
      }),

      findUniqueOrThrow: vi.fn(async (args: any) => {
        if (args.where.id === buyerWallet.id) return buyerWallet;
        if (args.where.id === sellerWallet.id) return sellerWallet;
        if (args.where.id === platformWallet.id) return platformWallet;

        throw new Error("Unexpected wallet lookup");
      }),
    },

    walletLedger: {
      create: vi.fn(async (args: any) => args),
    },

    auditLog: {
      create: vi.fn(async (args: any) => args),
    },

    $queryRaw: vi.fn(async () => [{ id: "locked-row" }]),
  };

  prismaMock.$transaction.mockImplementation(
    async (callback: (transaction: any) => Promise<unknown>) => callback(tx),
  );

  commissionPolicyMock.mockResolvedValue({
    rateBps: options.commissionRateBps ?? 1000,
  });

  return {
    tx,
    escrow,
    buyerWallet,
    sellerWallet,
    platformWallet,
  };
}

describe("releaseEscrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("input and escrow lookup", () => {
    it("rejects an empty escrow ID", async () => {
      await expect(releaseEscrow({ escrowId: "  " })).rejects.toThrow(
        "Escrow ID is required",
      );

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("rejects when the escrow locator is missing", async () => {
      makeHarness({ escrowLocator: null });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow not found",
      );
    });

    it("rejects when the locked order cannot be found", async () => {
      const { tx } = makeHarness();

      tx.$queryRaw.mockResolvedValueOnce([]);

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "The order associated with this escrow was not found",
      );
    });

    it("uses a serializable transaction", async () => {
      makeHarness();

      await releaseEscrow({ escrowId: ESCROW_ID });

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxWait: 10_000,
          timeout: 20_000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }),
      );
    });
  });

  describe("refund reconciliation", () => {
    it("rejects completed refunds that do not match refundedAmount", async () => {
      makeHarness({
        completedRefunds: 200,
        escrow: { refundedAmount: D(100) },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow refund totals do not match completed refund records",
      );
    });

    it("rejects completed refunds greater than the original escrow", async () => {
      makeHarness({
        completedRefunds: 1100,
        escrow: { refundedAmount: D(1100) },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Completed refunds exceed the original escrow amount",
      );
    });

    it("rejects negative completed refund totals", async () => {
      makeHarness({
        completedRefunds: -1,
        escrow: { refundedAmount: D(-1) },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow();
    });

    it("rejects when no escrow funds remain after refunds", async () => {
      makeHarness({
        completedRefunds: 1000,
        escrow: {
          refundedAmount: D(1000),
          status: "PARTIALLY_REFUNDED",
          order: {
            ...makeEscrow().order,
            paymentStatus: "PARTIALLY_REFUNDED",
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "No escrow funds remain after refunds",
      );
    });
  });

  describe("idempotency", () => {
    it("returns saved settlement amounts without transferring funds again", async () => {
      const { tx } = makeHarness({
        escrow: {
          status: "RELEASED",
          releasedAmount: D(1000),
          metadata: {
            releasedGrossAmount: "1000",
            commissionAmount: "100",
            sellerNetAmount: "900",
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).resolves.toEqual({
        escrowId: ESCROW_ID,
        orderId: ORDER_ID,
        grossAmount: "1000.00",
        commissionAmount: "100.00",
        sellerNetAmount: "900.00",
        alreadyReleased: true,
      });

      expect(tx.wallet.updateMany).not.toHaveBeenCalled();
      expect(tx.walletLedger.create).not.toHaveBeenCalled();
      expect(tx.auditLog.create).not.toHaveBeenCalled();
      expect(commissionPolicyMock).not.toHaveBeenCalled();
    });

    it("rejects a released escrow with missing settlement metadata", async () => {
      makeHarness({
        escrow: {
          status: "RELEASED",
          releasedAmount: D(1000),
          metadata: {},
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Released escrow is missing its saved settlement amounts",
      );
    });

    it("rejects inconsistent saved settlement amounts", async () => {
      makeHarness({
        escrow: {
          status: "RELEASED",
          releasedAmount: D(1000),
          metadata: {
            releasedGrossAmount: "1000",
            commissionAmount: "100",
            sellerNetAmount: "800",
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Saved escrow settlement amounts are inconsistent",
      );
    });
  });

  describe("release eligibility", () => {
    it("rejects escrow statuses that cannot be released", async () => {
      const { tx } = makeHarness({
        escrow: { status: "RELEASE_PENDING" },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow cannot be released while its status is RELEASE_PENDING",
      );

      expect(tx.wallet.updateMany).not.toHaveBeenCalled();
    });

    it("rejects an order that has not been paid", async () => {
      makeHarness({
        escrow: {
          order: {
            ...makeEscrow().order,
            paymentStatus: "PENDING",
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Order payment must be paid or partially refunded before escrow can be released",
      );
    });

    it("rejects an order that has not reached delivery eligibility", async () => {
      makeHarness({
        escrow: {
          order: {
            ...makeEscrow().order,
            status: "IN_DELIVERY",
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow();
    });

    it("rejects an escrow whose buyer does not match the order", async () => {
      makeHarness({
        escrow: { buyerId: "another-buyer" },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow parties do not match the order",
      );
    });

    it("rejects an escrow whose seller does not own the order store", async () => {
      makeHarness({
        escrow: { sellerId: "another-seller" },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow parties do not match the order",
      );
    });

    it("rejects when the buyer and seller are the same account", async () => {
      makeHarness({
        escrow: {
          sellerId: BUYER_ID,
          order: {
            ...makeEscrow().order,
            store: { id: "store-1", ownerId: BUYER_ID },
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "The buyer and seller cannot be the same account",
      );
    });
  });

  describe("dispute and commission policy", () => {
    it("blocks release when a dispute is open", async () => {
      const { tx } = makeHarness({
        disputeLocator: { id: "dispute-1" },
        activeDispute: { id: "dispute-1", status: "OPEN" },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow cannot be released while a dispute is active",
      );

      expect(tx.wallet.updateMany).not.toHaveBeenCalled();
    });

    it("blocks release when a dispute is under review", async () => {
      makeHarness({
        disputeLocator: { id: "dispute-1" },
        activeDispute: {
          id: "dispute-1",
          status: "UNDER_REVIEW",
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow cannot be released while a dispute is active",
      );
    });

    it.each([-1, 10_001, 1.5])(
      "rejects an invalid commission rate of %s basis points",
      async (rateBps) => {
        makeHarness({ commissionRateBps: rateBps });

        await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
          "The platform commission policy contains an invalid rate",
        );
      },
    );

    it("rejects when the original escrow amount differs from the order total", async () => {
      makeHarness({
        escrow: {
          order: {
            ...makeEscrow().order,
            total: D(1200),
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Original escrow amount does not match the order total",
      );
    });
  });

  describe("wallet validation", () => {
    it("rejects a missing buyer wallet", async () => {
      makeHarness({ buyerWallet: null });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "The buyer wallet is missing or inactive",
      );
    });

    it("rejects an inactive buyer wallet", async () => {
      makeHarness({
        buyerWallet: { isActive: false },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "The buyer wallet is missing or inactive",
      );
    });

    it("rejects an inactive seller wallet", async () => {
      makeHarness({
        sellerWallet: { isActive: false },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "The seller wallet is missing or inactive",
      );
    });

    it("rejects wallet currencies that differ from the escrow", async () => {
      makeHarness({
        sellerWallet: { currency: "USD" },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Wallet currency does not match the escrow currency",
      );
    });

    it("rejects a missing platform wallet when commission is due", async () => {
      makeHarness({ platformWallet: null });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "The ROA platform wallet is not configured for this currency",
      );
    });

    it("rejects insufficient buyer held balance", async () => {
      const { tx } = makeHarness({
        buyerDebitCount: 0,
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "The buyer wallet does not have enough held funds for the remaining settlement",
      );

      expect(tx.escrow.update).not.toHaveBeenCalled();
    });
  });

  describe("settlement", () => {
    it("releases funds with the correct commission and seller net", async () => {
      const { tx, buyerWallet, sellerWallet, platformWallet } = makeHarness();

      await expect(
        releaseEscrow({
          escrowId: ESCROW_ID,
          releaseReason: "Inspection window completed",
        }),
      ).resolves.toEqual({
        escrowId: ESCROW_ID,
        orderId: ORDER_ID,
        grossAmount: "1000.00",
        commissionAmount: "100.00",
        sellerNetAmount: "900.00",
        alreadyReleased: false,
      });

      expect(buyerWallet.heldBalance.toString()).toBe("0");
      expect(sellerWallet.availableBalance.toString()).toBe("1000");
      expect(platformWallet.availableBalance.toString()).toBe("600");

      expect(tx.walletLedger.create).toHaveBeenCalledTimes(3);
      expect(tx.auditLog.create).toHaveBeenCalledTimes(1);

      expect(tx.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ESCROW_ID },
          data: expect.objectContaining({
            status: "RELEASED",
            releaseReason: "Inspection window completed",
            releasedAmount: expect.any(Prisma.Decimal),
          }),
        }),
      );
    });

    it("keeps the original commission after a partial refund", async () => {
      const { tx, buyerWallet, sellerWallet, platformWallet } = makeHarness({
        completedRefunds: 200,
        escrow: {
          refundedAmount: D(200),
          status: "PARTIALLY_REFUNDED",
          order: {
            ...makeEscrow().order,
            paymentStatus: "PARTIALLY_REFUNDED",
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).resolves.toEqual({
        escrowId: ESCROW_ID,
        orderId: ORDER_ID,
        grossAmount: "800.00",
        commissionAmount: "100.00",
        sellerNetAmount: "700.00",
        alreadyReleased: false,
      });

      expect(buyerWallet.heldBalance.toString()).toBe("200");
      expect(sellerWallet.availableBalance.toString()).toBe("800");
      expect(platformWallet.availableBalance.toString()).toBe("600");

      expect(tx.walletLedger.create).toHaveBeenCalledTimes(3);
    });

    it("reduces commission only when remaining funds cannot cover it", async () => {
      const { tx, sellerWallet, platformWallet } = makeHarness({
        completedRefunds: 950,
        escrow: {
          refundedAmount: D(950),
          status: "PARTIALLY_REFUNDED",
          order: {
            ...makeEscrow().order,
            paymentStatus: "PARTIALLY_REFUNDED",
          },
        },
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).resolves.toEqual({
        escrowId: ESCROW_ID,
        orderId: ORDER_ID,
        grossAmount: "50.00",
        commissionAmount: "50.00",
        sellerNetAmount: "0.00",
        alreadyReleased: false,
      });

      expect(sellerWallet.availableBalance.toString()).toBe("100");
      expect(platformWallet.availableBalance.toString()).toBe("550");

      // Buyer and platform ledgers only; no zero-value seller credit.
      expect(tx.walletLedger.create).toHaveBeenCalledTimes(2);
    });

    it("supports zero commission without requiring a platform wallet", async () => {
      const { tx, buyerWallet, sellerWallet } = makeHarness({
        commissionRateBps: 0,
        platformWallet: null,
      });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).resolves.toEqual({
        escrowId: ESCROW_ID,
        orderId: ORDER_ID,
        grossAmount: "1000.00",
        commissionAmount: "0.00",
        sellerNetAmount: "1000.00",
        alreadyReleased: false,
      });

      expect(buyerWallet.heldBalance.toString()).toBe("0");
      expect(sellerWallet.availableBalance.toString()).toBe("1100");
      expect(tx.wallet.findFirst).not.toHaveBeenCalled();
      expect(tx.walletLedger.create).toHaveBeenCalledTimes(2);
    });

    it("does not mark escrow released when the conditional claim fails", async () => {
      const { tx } = makeHarness({ claimCount: 0 });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Escrow is already being processed or has changed status",
      );

      expect(tx.wallet.updateMany).not.toHaveBeenCalled();
      expect(tx.escrow.update).not.toHaveBeenCalled();
      expect(tx.auditLog.create).not.toHaveBeenCalled();
    });

    it("does not mark escrow released when seller credit fails", async () => {
      const { tx } = makeHarness({ sellerCreditCount: 0 });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Could not credit the seller wallet",
      );

      expect(tx.escrow.update).not.toHaveBeenCalled();
      expect(tx.auditLog.create).not.toHaveBeenCalled();
    });

    it("does not mark escrow released when platform credit fails", async () => {
      const { tx } = makeHarness({ platformCreditCount: 0 });

      await expect(releaseEscrow({ escrowId: ESCROW_ID })).rejects.toThrow(
        "Could not credit the platform wallet",
      );

      expect(tx.escrow.update).not.toHaveBeenCalled();
      expect(tx.auditLog.create).not.toHaveBeenCalled();
    });

    it("records the completed settlement in the audit log", async () => {
      const { tx } = makeHarness();

      await releaseEscrow({ escrowId: ESCROW_ID });

      expect(tx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorType: "SYSTEM",
            action: "ESCROW_RELEASED",
            orderId: ORDER_ID,
            escrowId: ESCROW_ID,
            userId: SELLER_ID,
            reference: `ESCROW-RELEASE-${ESCROW_ID}`,
          }),
        }),
      );
    });
  });
});
