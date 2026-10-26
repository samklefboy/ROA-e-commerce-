import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

export type DashboardPeriod = "7d" | "30d" | "12m";

const LOW_STOCK_THRESHOLD = 5;
const PAID_STATUSES = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] as const;
const HELD_ESCROW_STATUSES = [
  "HELD",
  "RELEASE_PENDING",
  "DISPUTED",
  "REFUND_PENDING",
] as const;

const asNumber = (value: unknown): number => {
  if (value == null) return 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const moneyRound = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const startOfMonth = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const monthKey = (date: Date): string => dateKey(date).slice(0, 7);

function getPeriodBounds(period: DashboardPeriod, now: Date) {
  const today = startOfDay(now);

  if (period === "7d") {
    const start = addDays(today, -6);
    return {
      start,
      end: addDays(today, 1),
      previousStart: addDays(start, -7),
      previousEnd: start,
      bucketCount: 7,
      bucket: "day" as const,
    };
  }

  if (period === "30d") {
    const start = addDays(today, -29);
    return {
      start,
      end: addDays(today, 1),
      previousStart: addDays(start, -30),
      previousEnd: start,
      bucketCount: 30,
      bucket: "day" as const,
    };
  }

  const start = addMonths(startOfMonth(today), -11);
  const end = addMonths(startOfMonth(today), 1);
  return {
    start,
    end,
    previousStart: addMonths(start, -12),
    previousEnd: start,
    bucketCount: 12,
    bucket: "month" as const,
  };
}

const orderSalesAmount = (order: {
  subtotal: unknown;
  discount: unknown;
}): number => Math.max(0, asNumber(order.subtotal) - asNumber(order.discount));

function imageUrlFromJson(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    const item = first as Record<string, unknown>;
    for (const key of ["url", "src", "secure_url"]) {
      if (typeof item[key] === "string") return item[key] as string;
    }
  }
  return null;
}

function makeRevenueBuckets(
  period: DashboardPeriod,
  start: Date,
  count: number,
  salesOrders: Array<{ createdAt: Date; subtotal: unknown; discount: unknown }>,
) {
  const buckets = new Map<string, number>();
  for (let index = 0; index < count; index += 1) {
    const bucketDate =
      period === "12m" ? addMonths(start, index) : addDays(start, index);
    buckets.set(
      period === "12m" ? monthKey(bucketDate) : dateKey(bucketDate),
      0,
    );
  }

  for (const order of salesOrders) {
    const key =
      period === "12m" ? monthKey(order.createdAt) : dateKey(order.createdAt);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + orderSalesAmount(order));
    }
  }

  return [...buckets.entries()].map(([date, amount]) => ({
    date,
    amount: moneyRound(amount),
  }));
}

/**
 * Seller dashboard metrics are scoped to the store owned by the authenticated user.
 * Sales revenue is product subtotal less order discount (delivery fees excluded).
 * Released seller earnings are reported separately from gross sales.
 */
export async function getStoreDashboardOverview(
  userId: string,
  period: DashboardPeriod = "7d",
) {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      status: true,
      isOpen: true,
      isVerified: true,
      ratingStars: true,
      ratingCount: true,
      followerCount: true,
      createdAt: true,
    },
  });

  if (!store) {
    throw new ApiError(404, "You do not have a store yet.", "STORE_NOT_FOUND");
  }

  const now = new Date();
  const bounds = getPeriodBounds(period, now);
  const paidOrderWhere: Prisma.OrderWhereInput = {
    storeId: store.id,
    paymentStatus: { in: [...PAID_STATUSES] },
    status: { notIn: ["CANCELLED", "RETURNED"] },
  };

  const [
    totalOrders,
    activeProducts,
    lowStockProducts,
    pendingOrders,
    completedOrders,
    periodOrders,
    previousPeriodOrders,
    todayOrders,
    recentOrdersRaw,
    heldEscrows,
    releasedEscrows,
    periodRefunds,
    storeOrderIds,
  ] = await Promise.all([
    prisma.order.count({ where: { storeId: store.id } }),
    prisma.product.count({ where: { storeId: store.id, status: "ACTIVE" } }),
    prisma.product.count({
      where: {
        storeId: store.id,
        status: "ACTIVE",
        stock: { not: null, lte: LOW_STOCK_THRESHOLD },
      },
    }),
    prisma.order.count({ where: { storeId: store.id, status: "PENDING" } }),
    prisma.order.count({ where: { storeId: store.id, status: "DELIVERED" } }),
    prisma.order.findMany({
      where: {
        ...paidOrderWhere,
        createdAt: { gte: bounds.start, lt: bounds.end },
      },
      select: { id: true, createdAt: true, subtotal: true, discount: true },
    }),
    prisma.order.findMany({
      where: {
        ...paidOrderWhere,
        createdAt: { gte: bounds.previousStart, lt: bounds.previousEnd },
      },
      select: { createdAt: true, subtotal: true, discount: true },
    }),
    prisma.order.findMany({
      where: {
        ...paidOrderWhere,
        createdAt: { gte: startOfDay(now), lt: addDays(startOfDay(now), 1) },
      },
      select: { subtotal: true, discount: true },
    }),
    prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        user: { select: { name: true } },
        items: { select: { id: true, quantity: true } },
      },
    }),
    prisma.escrow.findMany({
      where: {
        order: { storeId: store.id },
        status: { in: [...HELD_ESCROW_STATUSES] },
      },
      select: { amount: true, refundedAmount: true },
    }),
    prisma.escrow.findMany({
      where: {
        order: { storeId: store.id },
        status: "RELEASED",
        releasedAt: { gte: bounds.start, lt: bounds.end },
      },
      select: { releasedAmount: true, amount: true },
    }),
    prisma.refund.findMany({
      where: {
        order: { storeId: store.id },
        status: "COMPLETED",
        processedAt: { gte: bounds.start, lt: bounds.end },
      },
      select: { amount: true },
    }),
    prisma.order.findMany({
      where: { storeId: store.id },
      select: { id: true },
    }),
  ]);

  const orderIds = storeOrderIds.map((order) => order.id);
  const periodOrderIds = periodOrders.map((order) => order.id);

  const [commissionEntries, periodItems] = await Promise.all([
    orderIds.length
      ? prisma.walletLedger.findMany({
          where: {
            orderId: { in: orderIds },
            type: "COMMISSION",
            status: "COMPLETED",
            createdAt: { gte: bounds.start, lt: bounds.end },
          },
          select: { amount: true },
        })
      : Promise.resolve([]),
    periodOrderIds.length
      ? prisma.orderItem.findMany({
          where: {
            orderId: { in: periodOrderIds },
            order: paidOrderWhere,
          },
          select: {
            productId: true,
            productName: true,
            productImage: true,
            quantity: true,
            subtotal: true,
            product: { select: { name: true, images: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const periodRevenue = moneyRound(
    periodOrders.reduce((sum, order) => sum + orderSalesAmount(order), 0),
  );
  const previousPeriodRevenue = moneyRound(
    previousPeriodOrders.reduce(
      (sum, order) => sum + orderSalesAmount(order),
      0,
    ),
  );
  const todaySales = moneyRound(
    todayOrders.reduce((sum, order) => sum + orderSalesAmount(order), 0),
  );
  const sellerEarnings = moneyRound(
    releasedEscrows.reduce(
      (sum, escrow) => sum + asNumber(escrow.releasedAmount ?? escrow.amount),
      0,
    ),
  );
  const heldEarnings = moneyRound(
    heldEscrows.reduce(
      (sum, escrow) =>
        sum +
        Math.max(0, asNumber(escrow.amount) - asNumber(escrow.refundedAmount)),
      0,
    ),
  );
  const platformCommission = moneyRound(
    commissionEntries.reduce(
      (sum, entry) => sum + Math.abs(asNumber(entry.amount)),
      0,
    ),
  );
  const refunds = moneyRound(
    periodRefunds.reduce((sum, refund) => sum + asNumber(refund.amount), 0),
  );

  const productTotals = new Map<
    string,
    {
      id: string;
      name: string;
      imageUrl: string | null;
      quantitySold: number;
      revenue: number;
    }
  >();

  for (const item of periodItems) {
    const existing = productTotals.get(item.productId);
    const itemRevenue = asNumber(item.subtotal);
    if (existing) {
      existing.quantitySold += item.quantity;
      existing.revenue += itemRevenue;
      if (!existing.imageUrl && item.productImage)
        existing.imageUrl = item.productImage;
    } else {
      productTotals.set(item.productId, {
        id: item.productId,
        name: item.productName || item.product.name,
        imageUrl: item.productImage || imageUrlFromJson(item.product.images),
        quantitySold: item.quantity,
        revenue: itemRevenue,
      });
    }
  }

  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
    .slice(0, 5)
    .map((product) => ({ ...product, revenue: moneyRound(product.revenue) }));

  const revenue = makeRevenueBuckets(
    period,
    bounds.start,
    bounds.bucketCount,
    periodOrders,
  );

  return {
    period,
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      logo: store.logo,
      status: store.status,
      isOpen: store.isOpen,
      isVerified: store.isVerified,
      followerCount: store.followerCount,
      averageRating: asNumber(store.ratingStars),
      reviewCount: store.ratingCount,
      createdAt: store.createdAt,
    },
    summary: {
      todaySales,
      totalOrders,
      activeProducts,
      pendingOrders,
      lowStockProducts,
      periodRevenue,
      previousPeriodRevenue,
      sellerEarnings,
      heldEarnings,
      platformCommission,
      refunds,
      completedOrders,
      listingViews: null,
    },
    revenue,
    recentOrders: recentOrdersRaw.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name?.trim() || "Customer",
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: asNumber(order.total),
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
    })),
    topProducts,
  };
}
