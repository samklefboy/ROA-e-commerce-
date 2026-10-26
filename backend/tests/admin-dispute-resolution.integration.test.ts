import "dotenv/config";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DisputeItemOutcome,
  DisputeResolutionOutcome,
  Prisma,
} from "../generated/prisma/client.js";

import { prisma } from "../src/config/prisma.js";
import { resolveDispute } from "../src/services/admin/admin-dispute-resolution.service.js";

vi.setConfig({
  testTimeout: 30_000,
  hookTimeout: 30_000,
});

type VariantMode = "none" | "matched" | "unmatched";

type FixtureOptions = {
  variantMode?: VariantMode;
  orderStatus?: "IN_DELIVERY" | "DELIVERED";
  reason?: "NON_DELIVERY" | "DEFECTIVE";
};

type CleanupIds = {
  userIds: string[];
  storeIds: string[];
  productIds: string[];
  orderIds: string[];
  orderItemIds: string[];
  walletIds: string[];
  escrowIds: string[];
  disputeIds: string[];
  disputeItemIds: string[];
};

const newCleanupIds = (): CleanupIds => ({
  userIds: [],
  storeIds: [],
  productIds: [],
  orderIds: [],
  orderItemIds: [],
  walletIds: [],
  escrowIds: [],
  disputeIds: [],
  disputeItemIds: [],
});

let cleanupIds = newCleanupIds();

const runDatabaseIntegrationTests =
  process.env.ROA_RUN_DB_INTEGRATION === "true";

async function createFixture(options: FixtureOptions = {}) {
  const variantMode = options.variantMode ?? "none";
  const orderStatus = options.orderStatus ?? "IN_DELIVERY";
  const reason = options.reason ?? "NON_DELIVERY";

  const suffix = `${Date.now()}-${crypto.randomUUID()}`;

  const buyer = await prisma.user.create({
    data: {
      phone: `+234${suffix.replace(/\D/g, "").slice(-10)}1`,
      isVerified: true,
    },
  });
  cleanupIds.userIds.push(buyer.id);

  const seller = await prisma.user.create({
    data: {
      phone: `+235${suffix.replace(/\D/g, "").slice(-10)}2`,
      isVerified: true,
      hasStore: true,
    },
  });
  cleanupIds.userIds.push(seller.id);

  const admin = await prisma.user.create({
    data: {
      phone: `+236${suffix.replace(/\D/g, "").slice(-10)}3`,
      isVerified: true,
      role: "ADMIN",
    },
  });
  cleanupIds.userIds.push(admin.id);

  const store = await prisma.store.create({
    data: {
      name: `Integration Store ${suffix}`,
      slug: `integration-${suffix}`,
      status: "ACTIVE",
      isOpen: true,
      ownerId: seller.id,
    },
  });
  cleanupIds.storeIds.push(store.id);

  const hasVariants = variantMode !== "none";

  const product = await prisma.product.create({
    data: {
      storeId: store.id,
      name: `Integration Product ${suffix}`,
      slug: `product-${suffix}`,
      description: "Integration test product",
      images: [],
      price: new Prisma.Decimal("1000.00"),
      status: "ACTIVE",
      stock: hasVariants ? null : 5,
      hasVariants,
    },
  });
  cleanupIds.productIds.push(product.id);

  let productVariantId: string | null = null;

  if (hasVariants) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        combination:
          variantMode === "matched"
            ? { Color: "Red", Size: "M" }
            : { Color: "Blue", Size: "M" },
        price: new Prisma.Decimal("1000.00"),
        stock: 4,
        sku: `SKU-${suffix}`,
      },
    });

    productVariantId = variant.id;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: `IT-${suffix}`,
      userId: buyer.id,
      storeId: store.id,
      status: orderStatus,
      paymentStatus: "PAID",
      paymentMethod: "WALLET",
      subtotal: new Prisma.Decimal("1000.00"),
      deliveryFee: new Prisma.Decimal("100.00"),
      discount: new Prisma.Decimal("0.00"),
      total: new Prisma.Decimal("1100.00"),
      currency: "NGN",
      deliveryType: "DELIVERY",
    },
  });
  cleanupIds.orderIds.push(order.id);

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: new Prisma.Decimal("1000.00"),
      subtotal: new Prisma.Decimal("1000.00"),
      ...(hasVariants ? { variant: { Color: "Red", Size: "M" } } : {}),
      status: "ACTIVE",
    },
  });
  cleanupIds.orderItemIds.push(orderItem.id);

  const wallet = await prisma.wallet.create({
    data: {
      userId: buyer.id,
      availableBalance: new Prisma.Decimal("0.00"),
      heldBalance: new Prisma.Decimal("1100.00"),
      currency: "NGN",
      isActive: true,
    },
  });
  cleanupIds.walletIds.push(wallet.id);

  const escrow = await prisma.escrow.create({
    data: {
      orderId: order.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      amount: new Prisma.Decimal("1100.00"),
      currency: "NGN",
      status: "DISPUTED",
    },
  });
  cleanupIds.escrowIds.push(escrow.id);

  const dispute = await prisma.dispute.create({
    data: {
      orderId: order.id,
      escrowId: escrow.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      reason,
      status: "UNDER_REVIEW",
      description: "Integration test dispute description",
    },
  });
  cleanupIds.disputeIds.push(dispute.id);

  const disputeItem = await prisma.disputeItem.create({
    data: {
      disputeId: dispute.id,
      orderItemId: orderItem.id,
      claimedQuantity: 1,
    },
  });
  cleanupIds.disputeItemIds.push(disputeItem.id);

  return {
    buyer,
    seller,
    admin,
    store,
    product,
    productVariantId,
    order,
    orderItem,
    wallet,
    escrow,
    dispute,
    disputeItem,
  };
}

async function cleanupFixtures() {
  const ids = cleanupIds;

  // Remove dependent records before their referenced records.
  if (ids.userIds.length > 0) {
    await prisma.notification.deleteMany({
      where: { recipientId: { in: ids.userIds } },
    });
  }

  if (ids.orderIds.length > 0 || ids.disputeIds.length > 0) {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          ...(ids.orderIds.length ? [{ orderId: { in: ids.orderIds } }] : []),
          ...(ids.disputeIds.length
            ? [{ disputeId: { in: ids.disputeIds } }]
            : []),
        ],
      },
    });
  }

  if (ids.disputeIds.length > 0) {
    await prisma.disputeItem.deleteMany({
      where: { disputeId: { in: ids.disputeIds } },
    });

    await prisma.dispute.deleteMany({
      where: { id: { in: ids.disputeIds } },
    });
  }

  if (ids.orderIds.length > 0) {
    await prisma.refund.deleteMany({
      where: { orderId: { in: ids.orderIds } },
    });
  }

  if (ids.walletIds.length > 0) {
    await prisma.walletLedger.deleteMany({
      where: { walletId: { in: ids.walletIds } },
    });
  }

  if (ids.escrowIds.length > 0) {
    await prisma.escrow.deleteMany({
      where: { id: { in: ids.escrowIds } },
    });
  }

  if (ids.orderIds.length > 0) {
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: ids.orderIds } },
    });

    await prisma.order.deleteMany({
      where: { id: { in: ids.orderIds } },
    });
  }

  if (ids.productIds.length > 0) {
    await prisma.productVariant.deleteMany({
      where: { productId: { in: ids.productIds } },
    });

    await prisma.product.deleteMany({
      where: { id: { in: ids.productIds } },
    });
  }

  if (ids.walletIds.length > 0) {
    await prisma.wallet.deleteMany({
      where: { id: { in: ids.walletIds } },
    });
  }

  if (ids.storeIds.length > 0) {
    await prisma.store.deleteMany({
      where: { id: { in: ids.storeIds } },
    });
  }

  if (ids.userIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: ids.userIds } },
    });
  }

  cleanupIds = newCleanupIds();
}

const describeDatabase = runDatabaseIntegrationTests ? describe : describe.skip;

describeDatabase("Admin dispute resolution — PostgreSQL integration", () => {
  afterEach(async () => {
    await cleanupFixtures();
  });

  it("refunds a seller-responsible non-delivery and restores product stock", async () => {
    const f = await createFixture();

    const result = await resolveDispute({
      disputeId: f.dispute.id,
      adminId: f.admin.id,
      outcome: DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
      resolutionNote: "Seller failed to deliver the order.",
    });

    const [wallet, escrow, order, dispute, product, refunds, ledgers] =
      await Promise.all([
        prisma.wallet.findUniqueOrThrow({
          where: { id: f.wallet.id },
        }),
        prisma.escrow.findUniqueOrThrow({
          where: { id: f.escrow.id },
        }),
        prisma.order.findUniqueOrThrow({
          where: { id: f.order.id },
        }),
        prisma.dispute.findUniqueOrThrow({
          where: { id: f.dispute.id },
        }),
        prisma.product.findUniqueOrThrow({
          where: { id: f.product.id },
        }),
        prisma.refund.findMany({
          where: { orderId: f.order.id },
        }),
        prisma.walletLedger.findMany({
          where: { walletId: f.wallet.id },
        }),
      ]);

    expect(result.refund.amount).toBe("1100.00");
    expect(wallet.availableBalance.toFixed(2)).toBe("1100.00");
    expect(wallet.heldBalance.toFixed(2)).toBe("0.00");

    expect(escrow.status).toBe("REFUNDED");
    expect(escrow.refundedAmount?.toFixed(2)).toBe("1100.00");

    expect(order.status).toBe("CANCELLED");
    expect(order.paymentStatus).toBe("REFUNDED");

    expect(dispute.status).toBe("RESOLVED_BUYER");
    expect(product.stock).toBe(6);

    expect(refunds).toHaveLength(1);
    expect(refunds[0].status).toBe("COMPLETED");
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0].type).toBe("REFUND");
  });

  it("restores the matching product variant exactly once", async () => {
    const f = await createFixture({ variantMode: "matched" });

    expect(f.productVariantId).not.toBeNull();

    await resolveDispute({
      disputeId: f.dispute.id,
      adminId: f.admin.id,
      outcome: DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
      resolutionNote: "Seller failed to deliver the order.",
    });

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: f.productVariantId! },
    });

    expect(variant.stock).toBe(5);
  });

  it("rolls back financial and order changes when stock restoration fails", async () => {
    const f = await createFixture({ variantMode: "unmatched" });

    await expect(
      resolveDispute({
        disputeId: f.dispute.id,
        adminId: f.admin.id,
        outcome: DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
        resolutionNote: "Seller failed to deliver the order.",
      }),
    ).rejects.toThrow();

    const [wallet, escrow, order, dispute, refunds, ledgers] =
      await Promise.all([
        prisma.wallet.findUniqueOrThrow({
          where: { id: f.wallet.id },
        }),
        prisma.escrow.findUniqueOrThrow({
          where: { id: f.escrow.id },
        }),
        prisma.order.findUniqueOrThrow({
          where: { id: f.order.id },
        }),
        prisma.dispute.findUniqueOrThrow({
          where: { id: f.dispute.id },
        }),
        prisma.refund.findMany({
          where: { orderId: f.order.id },
        }),
        prisma.walletLedger.findMany({
          where: { walletId: f.wallet.id },
        }),
      ]);

    expect(wallet.availableBalance.toFixed(2)).toBe("0.00");
    expect(wallet.heldBalance.toFixed(2)).toBe("1100.00");

    expect(escrow.status).toBe("DISPUTED");
    expect(escrow.refundedAmount).toBeNull();

    expect(order.status).toBe("IN_DELIVERY");
    expect(order.paymentStatus).toBe("PAID");

    expect(dispute.status).toBe("UNDER_REVIEW");
    expect(refunds).toHaveLength(0);
    expect(ledgers).toHaveLength(0);
  });

  it("does not issue a second refund or restore stock twice on retry", async () => {
    const f = await createFixture();

    const input = {
      disputeId: f.dispute.id,
      adminId: f.admin.id,
      outcome: DisputeResolutionOutcome.SELLER_RESPONSIBLE_NON_DELIVERY,
      resolutionNote: "Seller failed to deliver the order.",
    };

    await resolveDispute(input);

    await expect(resolveDispute(input)).rejects.toThrow();

    const [product, wallet, refunds, ledgers] = await Promise.all([
      prisma.product.findUniqueOrThrow({
        where: { id: f.product.id },
      }),
      prisma.wallet.findUniqueOrThrow({
        where: { id: f.wallet.id },
      }),
      prisma.refund.findMany({
        where: { orderId: f.order.id },
      }),
      prisma.walletLedger.findMany({
        where: { walletId: f.wallet.id },
      }),
    ]);

    expect(product.stock).toBe(6);
    expect(wallet.availableBalance.toFixed(2)).toBe("1100.00");
    expect(wallet.heldBalance.toFixed(2)).toBe("0.00");
    expect(refunds).toHaveLength(1);
    expect(ledgers).toHaveLength(1);
  });

  it("does not refund or restore stock for a rejected dispute", async () => {
    const f = await createFixture();

    await resolveDispute({
      disputeId: f.dispute.id,
      adminId: f.admin.id,
      outcome: DisputeResolutionOutcome.REJECTED,
      resolutionNote: "The buyer claim was not substantiated.",
    });

    const [product, wallet, escrow, order, dispute, refunds, ledgers] =
      await Promise.all([
        prisma.product.findUniqueOrThrow({
          where: { id: f.product.id },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: f.wallet.id },
        }),
        prisma.escrow.findUniqueOrThrow({
          where: { id: f.escrow.id },
        }),
        prisma.order.findUniqueOrThrow({
          where: { id: f.order.id },
        }),
        prisma.dispute.findUniqueOrThrow({
          where: { id: f.dispute.id },
        }),
        prisma.refund.findMany({
          where: { orderId: f.order.id },
        }),
        prisma.walletLedger.findMany({
          where: { walletId: f.wallet.id },
        }),
      ]);

    expect(product.stock).toBe(5);
    expect(wallet.availableBalance.toFixed(2)).toBe("0.00");
    expect(wallet.heldBalance.toFixed(2)).toBe("1100.00");

    expect(escrow.status).toBe("HELD");
    expect(order.status).toBe("IN_DELIVERY");
    expect(order.paymentStatus).toBe("PAID");
    expect(dispute.status).toBe("RESOLVED_SELLER");

    expect(refunds).toHaveLength(0);
    expect(ledgers).toHaveLength(0);
  });

  it("does not restore stock for product compensation on a delivered order", async () => {
    const f = await createFixture({
      orderStatus: "DELIVERED",
      reason: "DEFECTIVE",
    });

    await resolveDispute({
      disputeId: f.dispute.id,
      adminId: f.admin.id,
      outcome: DisputeResolutionOutcome.PRODUCT_COMPENSATION,
      resolutionNote: "Partial compensation approved for the defect.",
      itemDecisions: [
        {
          disputeItemId: f.disputeItem.id,
          outcome: DisputeItemOutcome.MINOR_DEFECT,
          approvedQuantity: 1,
        },
      ],
    });

    const [product, order, dispute] = await Promise.all([
      prisma.product.findUniqueOrThrow({
        where: { id: f.product.id },
      }),
      prisma.order.findUniqueOrThrow({
        where: { id: f.order.id },
      }),
      prisma.dispute.findUniqueOrThrow({
        where: { id: f.dispute.id },
      }),
    ]);

    expect(product.stock).toBe(5);
    expect(order.status).toBe("DELIVERED");
    expect(dispute.resolutionOutcome).toBe("PRODUCT_COMPENSATION");
  });
});
