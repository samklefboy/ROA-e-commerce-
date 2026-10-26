import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "../src/config/prisma.js";
import { releaseEscrow } from "../src/services/escrow-release.service.js";

const COMMISSION_POLICY_ID = "global";
const COMMISSION_RATE_BPS = 1000;
const ORDER_AMOUNT = "1000.00";
const RELEASE_ELIGIBILITY_HOURS = 36;

type Fixture = {
  buyerId: string;
  sellerId: string;
  storeId: string;
  orderId: string;
  escrowId: string;
  buyerWalletId: string;
  sellerWalletId: string;
  platformWalletId: string;
};

let fixture: Fixture | undefined;
let previousPolicy: { rateBps: number; isActive: boolean } | null = null;

function uniqueSuffix() {
  return randomUUID().replaceAll("-", "");
}

async function createFixture(): Promise<Fixture> {
  const suffix = uniqueSuffix();
  const deliveredAt = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const releaseEligibleAt = new Date(
    deliveredAt.getTime() + RELEASE_ELIGIBILITY_HOURS * 60 * 60 * 1000,
  );

  const buyer = await prisma.user.create({
    data: {
      phone: `+234${suffix.slice(0, 10)}`,
      isVerified: true,
    },
  });

  const seller = await prisma.user.create({
    data: {
      phone: `+235${suffix.slice(0, 10)}`,
      isVerified: true,
    },
  });

  const store = await prisma.store.create({
    data: {
      name: `Escrow Integration Store ${suffix}`,
      slug: `escrow-integration-${suffix}`,
      status: "ACTIVE",
      ownerId: seller.id,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `ROA-ESCROW-${suffix}`,
      userId: buyer.id,
      storeId: store.id,
      status: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "WALLET",
      subtotal: ORDER_AMOUNT,
      deliveryFee: "0.00",
      discount: "0.00",
      total: ORDER_AMOUNT,
      currency: "NGN",
      deliveryType: "DELIVERY",
      deliveredAt,
      tracking: {
        create: {
          status: "DELIVERED",
          note: "Buyer confirmed receipt.",
          createdAt: deliveredAt,
        },
      },
    },
  });

  const escrow = await prisma.escrow.create({
    data: {
      orderId: order.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      amount: ORDER_AMOUNT,
      refundedAmount: "0.00",
      currency: "NGN",
      status: "HELD",
      heldAt: new Date(deliveredAt.getTime() - 24 * 60 * 60 * 1000),
      releaseEligibleAt,
    },
  });

  const buyerWallet = await prisma.wallet.create({
    data: {
      userId: buyer.id,
      ownerType: "USER",
      currency: "NGN",
      isActive: true,
      availableBalance: "0.00",
      heldBalance: ORDER_AMOUNT,
    },
  });

  const sellerWallet = await prisma.wallet.create({
    data: {
      userId: seller.id,
      ownerType: "USER",
      currency: "NGN",
      isActive: true,
      availableBalance: "100.00",
      heldBalance: "0.00",
    },
  });

  const platformWallet = await prisma.wallet.create({
    data: {
      ownerType: "PLATFORM",
      userId: null,
      currency: "NGN",
      isActive: true,
      availableBalance: "500.00",
      heldBalance: "0.00",
    },
  });

  return {
    buyerId: buyer.id,
    sellerId: seller.id,
    storeId: store.id,
    orderId: order.id,
    escrowId: escrow.id,
    buyerWalletId: buyerWallet.id,
    sellerWalletId: sellerWallet.id,
    platformWalletId: platformWallet.id,
  };
}

async function cleanupFixture() {
  if (!fixture) return;

  const current = fixture;
  fixture = undefined;

  // Delete dependent records before their parent records.
  await prisma.auditLog.deleteMany({
    where: { orderId: current.orderId },
  });

  await prisma.walletLedger.deleteMany({
    where: { escrowId: current.escrowId },
  });

  await prisma.escrow.deleteMany({
    where: { id: current.escrowId },
  });

  await prisma.orderTracking.deleteMany({
    where: { orderId: current.orderId },
  });

  await prisma.order.deleteMany({
    where: { id: current.orderId },
  });

  await prisma.wallet.deleteMany({
    where: {
      id: {
        in: [
          current.buyerWalletId,
          current.sellerWalletId,
          current.platformWalletId,
        ],
      },
    },
  });

  await prisma.store.deleteMany({
    where: { id: current.storeId },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: [current.buyerId, current.sellerId],
      },
    },
  });
}

describe("releaseEscrow — PostgreSQL integration", () => {
  beforeAll(async () => {
    const existing = await prisma.platformCommissionPolicy.findUnique({
      where: { id: COMMISSION_POLICY_ID },
      select: { rateBps: true, isActive: true },
    });

    previousPolicy = existing;

    await prisma.platformCommissionPolicy.upsert({
      where: { id: COMMISSION_POLICY_ID },
      create: {
        id: COMMISSION_POLICY_ID,
        rateBps: COMMISSION_RATE_BPS,
        isActive: true,
      },
      update: {
        rateBps: COMMISSION_RATE_BPS,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    if (previousPolicy) {
      await prisma.platformCommissionPolicy.update({
        where: { id: COMMISSION_POLICY_ID },
        data: previousPolicy,
      });
    } else {
      await prisma.platformCommissionPolicy.deleteMany({
        where: { id: COMMISSION_POLICY_ID },
      });
    }
  });

  beforeEach(async () => {
    fixture = await createFixture();
  });

  afterEach(async () => {
    await cleanupFixture();
  });

  it("persists a complete settlement to PostgreSQL", async () => {
    const current = fixture!;

    const result = await releaseEscrow({
      escrowId: current.escrowId,
      releaseReason: "Integration test settlement",
    });

    expect(result).toEqual({
      escrowId: current.escrowId,
      orderId: current.orderId,
      grossAmount: "1000.00",
      commissionAmount: "100.00",
      sellerNetAmount: "900.00",
      alreadyReleased: false,
    });

    const [escrow, buyerWallet, sellerWallet, platformWallet] =
      await Promise.all([
        prisma.escrow.findUniqueOrThrow({
          where: { id: current.escrowId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.buyerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.sellerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.platformWalletId },
        }),
      ]);

    expect(escrow.status).toBe("RELEASED");
    expect(escrow.releasedAmount?.toFixed(2)).toBe("1000.00");
    expect(escrow.releaseReason).toBe("Integration test settlement");

    expect(buyerWallet.heldBalance.toFixed(2)).toBe("0.00");
    expect(sellerWallet.availableBalance.toFixed(2)).toBe("1000.00");
    expect(platformWallet.availableBalance.toFixed(2)).toBe("600.00");

    const ledgers = await prisma.walletLedger.findMany({
      where: { escrowId: current.escrowId },
    });

    expect(ledgers).toHaveLength(3);
    expect(ledgers.every((entry) => entry.status === "COMPLETED")).toBe(true);
    expect(
      ledgers.reduce((sum, entry) => sum + Number(entry.amount), 0),
    ).toBeCloseTo(1000, 2);

    const audit = await prisma.auditLog.findMany({
      where: {
        orderId: current.orderId,
        escrowId: current.escrowId,
        action: "ESCROW_RELEASED",
      },
    });

    expect(audit).toHaveLength(1);
  });

  it("rolls back all settlement changes if the platform credit fails", async () => {
    const current = fixture!;

    // Decimal(14, 2) has a maximum positive value of 999999999999.99.
    // The platform credit must overflow after the buyer debit and seller
    // credit have already been attempted inside the same transaction.
    await prisma.wallet.update({
      where: { id: current.platformWalletId },
      data: { availableBalance: "999999999999.99" },
    });

    await expect(
      releaseEscrow({ escrowId: current.escrowId }),
    ).rejects.toThrow();

    const [escrow, buyerWallet, sellerWallet, platformWallet, ledgers, audits] =
      await Promise.all([
        prisma.escrow.findUniqueOrThrow({
          where: { id: current.escrowId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.buyerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.sellerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.platformWalletId },
        }),
        prisma.walletLedger.findMany({
          where: { escrowId: current.escrowId },
        }),
        prisma.auditLog.findMany({
          where: {
            orderId: current.orderId,
            escrowId: current.escrowId,
            action: "ESCROW_RELEASED",
          },
        }),
      ]);

    expect(escrow.status).toBe("HELD");
    expect(escrow.releasedAt).toBeNull();
    expect(escrow.releasedAmount).toBeNull();

    expect(buyerWallet.heldBalance.toFixed(2)).toBe("1000.00");
    expect(sellerWallet.availableBalance.toFixed(2)).toBe("100.00");
    expect(platformWallet.availableBalance.toFixed(2)).toBe("999999999999.99");

    expect(ledgers).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });

  it("does not settle when the buyer has insufficient held funds", async () => {
    const current = fixture!;

    await prisma.wallet.update({
      where: { id: current.buyerWalletId },
      data: { heldBalance: "999.99" },
    });

    await expect(
      releaseEscrow({ escrowId: current.escrowId }),
    ).rejects.toThrow();

    const [escrow, buyerWallet, sellerWallet, platformWallet, ledgers, audits] =
      await Promise.all([
        prisma.escrow.findUniqueOrThrow({
          where: { id: current.escrowId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.buyerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.sellerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.platformWalletId },
        }),
        prisma.walletLedger.findMany({
          where: { escrowId: current.escrowId },
        }),
        prisma.auditLog.findMany({
          where: {
            orderId: current.orderId,
            escrowId: current.escrowId,
            action: "ESCROW_RELEASED",
          },
        }),
      ]);

    expect(escrow.status).toBe("HELD");
    expect(buyerWallet.heldBalance.toFixed(2)).toBe("999.99");
    expect(sellerWallet.availableBalance.toFixed(2)).toBe("100.00");
    expect(platformWallet.availableBalance.toFixed(2)).toBe("500.00");
    expect(ledgers).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });

  it("does not pay twice when the same escrow is released concurrently", async () => {
    const current = fixture!;

    const results = await Promise.allSettled([
      releaseEscrow({ escrowId: current.escrowId }),
      releaseEscrow({ escrowId: current.escrowId }),
    ]);

    const successful = results.filter(
      (result) => result.status === "fulfilled",
    );

    // Depending on PostgreSQL's serializable conflict outcome, the second
    // request may return the saved result or fail with a serialization error.
    expect(successful.length).toBeGreaterThanOrEqual(1);

    const [escrow, buyerWallet, sellerWallet, platformWallet, ledgers, audits] =
      await Promise.all([
        prisma.escrow.findUniqueOrThrow({
          where: { id: current.escrowId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.buyerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.sellerWalletId },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: current.platformWalletId },
        }),
        prisma.walletLedger.findMany({
          where: { escrowId: current.escrowId },
        }),
        prisma.auditLog.findMany({
          where: {
            orderId: current.orderId,
            escrowId: current.escrowId,
            action: "ESCROW_RELEASED",
          },
        }),
      ]);

    expect(escrow.status).toBe("RELEASED");
    expect(sellerWallet.availableBalance.toFixed(2)).toBe("1000.00");
    expect(platformWallet.availableBalance.toFixed(2)).toBe("600.00");
    expect(buyerWallet.heldBalance.toFixed(2)).toBe("0.00");
    expect(ledgers).toHaveLength(3);
    expect(audits).toHaveLength(1);
  });

  it("returns the saved settlement on retry without creating duplicate records", async () => {
    const current = fixture!;

    const first = await releaseEscrow({ escrowId: current.escrowId });
    const second = await releaseEscrow({ escrowId: current.escrowId });

    expect(first.alreadyReleased).toBe(false);
    expect(second).toEqual({
      ...first,
      alreadyReleased: true,
    });

    expect(
      await prisma.walletLedger.count({
        where: { escrowId: current.escrowId },
      }),
    ).toBe(3);

    expect(
      await prisma.auditLog.count({
        where: {
          orderId: current.orderId,
          escrowId: current.escrowId,
          action: "ESCROW_RELEASED",
        },
      }),
    ).toBe(1);
  });
});
