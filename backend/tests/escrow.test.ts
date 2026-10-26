import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import { ApiError } from "../src/utils/api-error.js";

const mocks = vi.hoisted(() => ({
  $transaction: vi.fn(),
  escrowFindUnique: vi.fn(),
  escrowCreate: vi.fn(),
  orderFindUnique: vi.fn(),
  queryRaw: vi.fn(),
  disputeFindUnique: vi.fn(),
  refundAggregate: vi.fn(),
  escrowUpdateMany: vi.fn(),
  walletFindUnique: vi.fn(),
  walletFindFirst: vi.fn(),
  walletUpdateMany: vi.fn(),
  walletLedgerCreate: vi.fn(),
  escrowUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
  getGlobalCommissionPolicy: vi.fn(),
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    $transaction: mocks.$transaction,
  },
}));

vi.mock("../src/services/commission-policy.service.js", () => ({
  getGlobalCommissionPolicy: mocks.getGlobalCommissionPolicy,
}));

import {
  createEscrowForOrder,
  getEscrowByOrderId,
  requireEscrowForOrder,
} from "../src/services/escrow.service.js";

import { releaseEscrow } from "../src/services/escrow-release.service.js";

const IDS = {
  order: "order-1",
  escrow: "escrow-1",
  buyer: "buyer-1",
  seller: "seller-1",
};

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: IDS.order,
    userId: IDS.buyer,
    total: new Prisma.Decimal("15000.00"),
    currency: "NGN",
    store: {
      id: "store-1",
      ownerId: IDS.seller,
    },
    ...overrides,
  };
}

function makeEscrow(overrides: Record<string, unknown> = {}) {
  return {
    id: IDS.escrow,
    orderId: IDS.order,
    buyerId: IDS.buyer,
    sellerId: IDS.seller,
    amount: new Prisma.Decimal("15000.00"),
    currency: "NGN",
    status: "HELD",
    refundedAmount: new Prisma.Decimal("0.00"),
    releasedAmount: null,
    releaseEligibleAt: null,
    metadata: null,
    order: {
      ...makeOrder(),
      status: "PENDING",
      deliveredAt: null,
      paymentStatus: "PAID",
      deliveryEvidence: [],
      tracking: [],
    },
    ...overrides,
  };
}

function makeTransaction() {
  return {
    escrow: {
      findUnique: mocks.escrowFindUnique,
      create: mocks.escrowCreate,
      updateMany: mocks.escrowUpdateMany,
      update: mocks.escrowUpdate,
    },
    order: {
      findUnique: mocks.orderFindUnique,
    },
    $queryRaw: mocks.queryRaw,
    dispute: {
      findUnique: mocks.disputeFindUnique,
    },
    refund: {
      aggregate: mocks.refundAggregate,
    },
    wallet: {
      findUnique: mocks.walletFindUnique,
      findFirst: mocks.walletFindFirst,
      updateMany: mocks.walletUpdateMany,
    },
    walletLedger: {
      create: mocks.walletLedgerCreate,
    },
    auditLog: {
      create: mocks.auditLogCreate,
    },
  };
}

describe("Escrow services", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mocks.escrowFindUnique.mockReset();
    mocks.escrowCreate.mockReset();
    mocks.orderFindUnique.mockReset();
    mocks.queryRaw.mockReset();
    mocks.disputeFindUnique.mockReset();
    mocks.refundAggregate.mockReset();
    mocks.escrowUpdateMany.mockReset();
    mocks.walletFindUnique.mockReset();
    mocks.walletFindFirst.mockReset();
    mocks.walletUpdateMany.mockReset();
    mocks.walletLedgerCreate.mockReset();
    mocks.escrowUpdate.mockReset();
    mocks.auditLogCreate.mockReset();
    mocks.getGlobalCommissionPolicy.mockReset();

    const tx = makeTransaction();

    mocks.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    );
  });

  describe("createEscrowForOrder", () => {
    it("returns the existing escrow without creating another one", async () => {
      const existing = makeEscrow();

      mocks.escrowFindUnique.mockResolvedValue(existing);

      const result = await createEscrowForOrder(
        makeTransaction() as never,
        IDS.order,
      );

      expect(result).toBe(existing);
      expect(mocks.escrowFindUnique).toHaveBeenCalledWith({
        where: { orderId: IDS.order },
      });
      expect(mocks.orderFindUnique).not.toHaveBeenCalled();
      expect(mocks.escrowCreate).not.toHaveBeenCalled();
    });

    it("rejects when the order does not exist", async () => {
      mocks.escrowFindUnique.mockResolvedValue(null);
      mocks.orderFindUnique.mockResolvedValue(null);

      await expect(
        createEscrowForOrder(makeTransaction() as never, IDS.order),
      ).rejects.toMatchObject({
        message: "Order not found",
      });

      expect(mocks.escrowCreate).not.toHaveBeenCalled();
    });

    it("rejects when the store has no seller", async () => {
      mocks.escrowFindUnique.mockResolvedValue(null);
      mocks.orderFindUnique.mockResolvedValue(
        makeOrder({
          store: {
            id: "store-1",
            ownerId: null,
          },
        }),
      );

      await expect(
        createEscrowForOrder(makeTransaction() as never, IDS.order),
      ).rejects.toMatchObject({
        message: "This store does not have a valid seller",
      });

      expect(mocks.escrowCreate).not.toHaveBeenCalled();
    });

    it("rejects when the order total is zero", async () => {
      mocks.escrowFindUnique.mockResolvedValue(null);
      mocks.orderFindUnique.mockResolvedValue(
        makeOrder({ total: new Prisma.Decimal("0.00") }),
      );

      await expect(
        createEscrowForOrder(makeTransaction() as never, IDS.order),
      ).rejects.toMatchObject({
        message: "Cannot create escrow for an order with zero total",
      });

      expect(mocks.escrowCreate).not.toHaveBeenCalled();
    });

    it("creates an escrow using the order's buyer, seller, total and currency", async () => {
      mocks.escrowFindUnique.mockResolvedValue(null);
      mocks.orderFindUnique.mockResolvedValue(makeOrder());

      const created = makeEscrow();
      mocks.escrowCreate.mockResolvedValue(created);

      const result = await createEscrowForOrder(
        makeTransaction() as never,
        IDS.order,
      );

      expect(mocks.escrowCreate).toHaveBeenCalledWith({
        data: {
          orderId: IDS.order,
          buyerId: IDS.buyer,
          sellerId: IDS.seller,
          amount: new Prisma.Decimal("15000.00"),
          currency: "NGN",
          status: "HELD",
          heldAt: expect.any(Date),
        },
      });

      expect(result).toBe(created);
    });
  });

  describe("getEscrowByOrderId", () => {
    it("looks up escrow by its order ID", async () => {
      const escrow = makeEscrow();
      mocks.escrowFindUnique.mockResolvedValue(escrow);

      const result = await getEscrowByOrderId(
        makeTransaction() as never,
        IDS.order,
      );

      expect(mocks.escrowFindUnique).toHaveBeenCalledWith({
        where: { orderId: IDS.order },
      });
      expect(result).toBe(escrow);
    });

    it("returns null when no escrow exists for the order", async () => {
      mocks.escrowFindUnique.mockResolvedValue(null);

      const result = await getEscrowByOrderId(
        makeTransaction() as never,
        IDS.order,
      );

      expect(result).toBeNull();
    });
  });

  describe("requireEscrowForOrder", () => {
    it("returns the escrow when one exists", async () => {
      const escrow = makeEscrow();
      mocks.escrowFindUnique.mockResolvedValue(escrow);

      const result = await requireEscrowForOrder(
        makeTransaction() as never,
        IDS.order,
      );

      expect(result).toBe(escrow);
    });

    it("rejects when the order has no escrow record", async () => {
      mocks.escrowFindUnique.mockResolvedValue(null);

      await expect(
        requireEscrowForOrder(makeTransaction() as never, IDS.order),
      ).rejects.toMatchObject({
        message: "Escrow record not found for this order",
      });
    });
  });

  describe("releaseEscrow input validation", () => {
    it.each([
      ["an empty string", ""],
      ["a whitespace-only string", "   "],
    ])("rejects %s escrow IDs", async (_description, escrowId) => {
      await expect(releaseEscrow({ escrowId })).rejects.toMatchObject({
        message: "Escrow ID is required",
      });

      expect(mocks.$transaction).not.toHaveBeenCalled();
    });

    it("rejects when the escrow does not exist", async () => {
      mocks.escrowFindUnique.mockResolvedValue(null);

      await expect(
        releaseEscrow({ escrowId: IDS.escrow }),
      ).rejects.toMatchObject({
        message: "Escrow not found",
      });

      expect(mocks.$transaction).toHaveBeenCalledOnce();
      expect(mocks.escrowFindUnique).toHaveBeenCalledWith({
        where: { id: IDS.escrow },
        select: { id: true, orderId: true },
      });
      expect(mocks.queryRaw).not.toHaveBeenCalled();
      expect(mocks.walletUpdateMany).not.toHaveBeenCalled();
      expect(mocks.walletLedgerCreate).not.toHaveBeenCalled();
    });
  });
});
