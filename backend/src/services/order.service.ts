import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { previewCheckout } from "./checkout.service.js";
import { reserveOrderStock } from "./order-stock.service.js";
import { createEscrowForOrder } from "./escrow.service.js";
import { holdWalletForOrder } from "./wallet/wallet-payment.service.js";
import { ApiError } from "../utils/api-error.js";
import type {
  CancelOrderInput,
  CreateOrderInput,
  OrderListQuery,
} from "../utils/validators/order.validation.js";

type AuthUser = { id: string; phone: string };

function decimalToNumber(value: unknown): number {
  return Number(value);
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ROA-${timestamp}-${random}`;
}

function getFirstImage(images: Prisma.JsonValue): string | null {
  if (!Array.isArray(images)) return null;
  const image = images[0];
  return typeof image === "string" ? image : null;
}

function normalizeVariant(
  variant: Prisma.JsonValue | null,
): Record<string, string> | null {
  if (
    variant === null ||
    typeof variant !== "object" ||
    Array.isArray(variant)
  ) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(variant)) {
    if (typeof value === "string") result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function createAddressSnapshot(address: {
  id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateCode: string | null;
  countryCode: string;
  landmark: string | null;
}) {
  return {
    id: address.id,
    recipientName: address.recipientName,
    phone: address.phone,
    street: address.addressLine1,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.stateCode,
    stateCode: address.stateCode,
    countryCode: address.countryCode,
    landmark: address.landmark,
  };
}

async function getAddressSnapshot(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
    select: {
      id: true,
      recipientName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      stateCode: true,
      countryCode: true,
      landmark: true,
    },
  });
  if (!address)
    throw new ApiError(400, "Selected delivery address was not found");
  if (address.countryCode !== "NG") {
    throw new ApiError(
      400,
      "Currently, checkout is only available for Nigerian addresses",
    );
  }
  return createAddressSnapshot(address);
}

function createStoreSnapshot(store: {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  location: string | null;
}) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    whatsapp: store.whatsapp,
    location: store.location,
  };
}

function createBuyerSnapshot(user: AuthUser) {
  return { id: user.id, phone: user.phone };
}

async function createUniqueOrderNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    const existing = await tx.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!existing) return orderNumber;
  }
  throw new ApiError(500, "Unable to generate a unique order number");
}

function buildTimestamps(tracking: Array<{ status: string; createdAt: Date }>) {
  const timestamps: Record<string, string> = {};
  for (const entry of tracking)
    timestamps[entry.status] = entry.createdAt.toISOString();
  return timestamps;
}

function serializeOrder(order: any) {
  const timestamps = buildTimestamps(order.tracking);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    subtotal: decimalToNumber(order.subtotal),
    deliveryFee: decimalToNumber(order.deliveryFee),
    discount: decimalToNumber(order.discount),
    total: decimalToNumber(order.total),
    deliveryType: order.deliveryType,
    deliveryProvider: order.deliveryProvider,
    deliveryAddress: order.deliveryAddressSnapshot ?? null,
    deliveryNote: order.deliveryNote,
    deliveryEstimateMin: order.deliveryEstimateMin,
    deliveryEstimateMax: order.deliveryEstimateMax,
    estimatedAt: order.estimatedAt,
    deliveredAt: order.deliveredAt,
    cancellationReason: order.cancellationReason,
    paymentReference: order.paymentReference,
    hasReviewed: order.hasReviewed,
    buyer: order.buyerSnapshot ?? null,
    store: order.store
      ? {
          id: order.store.id,
          name: order.store.name,
          slug: order.store.slug,
          whatsapp: order.store.whatsapp,
          location: order.store.location,
          isVerified: order.store.isVerified,
          isOpen: order.store.isOpen,
        }
      : (order.storeSnapshot ?? null),
    items: order.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      product: {
        id: item.productId,
        name: item.productName,
        slug: item.productSlug,
        images: item.productImage
          ? [item.productImage]
          : item.product
            ? [getFirstImage(item.product.images)].filter(Boolean)
            : [],
      },
      productName: item.productName,
      productSlug: item.productSlug,
      productImage: item.productImage,
      variant: normalizeVariant(item.variant),
      quantity: item.quantity,
      price: decimalToNumber(item.unitPrice),
      unitPrice: decimalToNumber(item.unitPrice),
      subtotal: decimalToNumber(item.subtotal),
      status: item.status,
    })),
    timestamps,
    tracking: order.tracking.map((entry: any) => ({
      id: entry.id,
      status: entry.status,
      note: entry.note,
      createdAt: entry.createdAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

const orderInclude = {
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      whatsapp: true,
      location: true,
      isVerified: true,
      isOpen: true,
    },
  },
  items: { orderBy: { createdAt: "asc" as const } },
  tracking: { orderBy: { createdAt: "asc" as const } },
};

function normalizeVariantSignature(value: unknown): string {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return "null";
  const entries = Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.length > 0 ? JSON.stringify(entries) : "null";
}

function createCheckoutItemSignature(item: {
  productId: string;
  storeId: string;
  quantity: number;
  variant: unknown;
}): string {
  return JSON.stringify([
    item.productId,
    item.storeId,
    item.quantity,
    normalizeVariantSignature(item.variant),
  ]);
}

function assertSameCheckoutItems(
  cartItems: Array<{
    productId: string;
    quantity: number;
    variant: Prisma.JsonValue | null;
    product: { storeId: string };
  }>,
  storeGroups: Array<{
    storeId: string;
    items: Array<{
      productId: string;
      quantity: number;
      variant: Record<string, string> | null;
    }>;
  }>,
): void {
  const actual = new Map<string, number>();
  const expected = new Map<string, number>();
  for (const item of cartItems) {
    const key = createCheckoutItemSignature({
      productId: item.productId,
      storeId: item.product.storeId,
      quantity: item.quantity,
      variant: item.variant,
    });
    actual.set(key, (actual.get(key) ?? 0) + 1);
  }
  for (const group of storeGroups) {
    for (const item of group.items) {
      const key = createCheckoutItemSignature({
        productId: item.productId,
        storeId: group.storeId,
        quantity: item.quantity,
        variant: item.variant,
      });
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }
  }
  if (
    actual.size !== expected.size ||
    [...actual].some(([key, count]) => expected.get(key) !== count)
  ) {
    throw new ApiError(
      409,
      "Your cart changed during checkout. Please review your cart and try again",
      "CHECKOUT_CART_CHANGED",
    );
  }
}

type RevalidationItem = {
  productId: string;
  storeId: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  discountAmount: number;
  discountPercentage: number | null;
  variant: Record<string, string> | null;
};

/**
 * Re-check prices and discount schedule inside the order transaction.
 * The OrderItem unit price remains the actual discounted price charged.
 */
async function revalidateOrderItems(
  tx: Prisma.TransactionClient,
  items: RevalidationItem[],
) {
  const now = new Date();

  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: {
        productVariants: true,
        discount: { include: { variantPriceSnapshots: true } },
      },
    });
    if (!product) {
      throw new ApiError(
        404,
        "One of the products in this order no longer exists",
      );
    }
    if (product.storeId !== item.storeId) {
      throw new ApiError(
        409,
        "A product's store changed during checkout. Please review your cart",
        "CHECKOUT_STORE_CHANGED",
      );
    }
    if (product.status !== "ACTIVE") {
      throw new ApiError(400, `${product.name} is no longer available`);
    }

    let currentPrice = Number(product.price);
    let originalUnitPrice = currentPrice;
    let selectedVariantId: string | null = null;

    if (product.hasVariants) {
      if (!item.variant) {
        throw new ApiError(400, `A variant is required for ${product.name}`);
      }
      const requestedEntries = Object.entries(item.variant)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("|");
      const selectedVariant = product.productVariants.find((variant) => {
        if (
          variant.combination === null ||
          typeof variant.combination !== "object" ||
          Array.isArray(variant.combination)
        )
          return false;
        const entries = Object.entries(variant.combination)
          .filter(([, value]) => typeof value === "string")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${value}`)
          .join("|");
        return entries === requestedEntries;
      });
      if (!selectedVariant) {
        throw new ApiError(
          400,
          `The selected variant for ${product.name} is no longer available`,
        );
      }
      selectedVariantId = selectedVariant.id;
      currentPrice = Number(selectedVariant.price);
      originalUnitPrice = currentPrice;
    }

    const discount = product.discount;
    const discountIsScheduledOrActive =
      discount?.status === "ACTIVE" &&
      (discount.startsAt.getTime() > now.getTime() ||
        (discount.startsAt.getTime() <= now.getTime() &&
          (discount.endsAt === null ||
            discount.endsAt.getTime() > now.getTime())));
    const discountIsCurrentlyActive =
      discount?.status === "ACTIVE" &&
      discount.startsAt.getTime() <= now.getTime() &&
      (discount.endsAt === null || discount.endsAt.getTime() > now.getTime());

    let expectedDiscountPercentage: number | null = null;
    let expectedDiscountAmount = 0;

    if (discountIsCurrentlyActive) {
      if (product.hasVariants) {
        const snapshot = discount.variantPriceSnapshots.find(
          (entry) => entry.productVariantId === selectedVariantId,
        );
        if (!snapshot) {
          throw new ApiError(
            409,
            `Discount pricing for ${product.name} needs to be refreshed`,
            "CHECKOUT_DISCOUNT_PRICE_INVALID",
          );
        }
        originalUnitPrice = Number(snapshot.originalPrice);
      } else {
        if (product.oldPrice === null) {
          throw new ApiError(
            409,
            `Discount pricing for ${product.name} needs to be refreshed`,
            "CHECKOUT_DISCOUNT_PRICE_INVALID",
          );
        }
        originalUnitPrice = Number(product.oldPrice);
      }
      expectedDiscountAmount = money(
        Math.max(0, originalUnitPrice - currentPrice) * item.quantity,
      );
      expectedDiscountPercentage =
        expectedDiscountAmount > 0 ? discount.percentage : null;
    } else if (discountIsScheduledOrActive) {
      // A scheduled discount becoming active between preview and order must force a retry.
      expectedDiscountAmount = 0;
    }

    const pricesChanged =
      money(currentPrice) !== money(item.unitPrice) ||
      money(originalUnitPrice) !== money(item.originalUnitPrice) ||
      money(expectedDiscountAmount) !== money(item.discountAmount) ||
      expectedDiscountPercentage !== item.discountPercentage;

    if (pricesChanged) {
      throw new ApiError(
        409,
        `${product.name} price or discount changed. Please review your checkout again`,
        "CHECKOUT_PRICE_CHANGED",
      );
    }
  }
}

export async function createOrders(user: AuthUser, input: CreateOrderInput) {
  if (input.paymentMethod !== "WALLET") {
    throw new ApiError(
      400,
      "Only wallet payments are currently available for orders",
    );
  }

  const preview = await previewCheckout(user.id, {
    cartId: input.cartId,
    itemIds: input.itemIds,
    addressId: input.addressId,
    delivery: input.delivery,
    paymentMethod: "WALLET",
    deliveryNote: input.deliveryNote,
  });
  if (!preview.items.length)
    throw new ApiError(400, "No checkout items were found");

  let addressSnapshot: ReturnType<typeof createAddressSnapshot> | null = null;
  const hasDelivery = preview.stores.some(
    (store) => store.delivery.deliveryType === "DELIVERY",
  );
  if (hasDelivery) {
    if (!input.addressId)
      throw new ApiError(400, "A delivery address is required");
    addressSnapshot = await getAddressSnapshot(user.id, input.addressId);
  }

  const orders = await prisma.$transaction(
    async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { id: input.cartId, userId: user.id },
        select: { id: true },
      });
      if (!cart) throw new ApiError(400, "Cart not found");

      // Lock stores in deterministic order to coordinate with store status changes.
      const storeIds = [
        ...new Set(preview.stores.map((store) => store.storeId)),
      ].sort();
      for (const storeId of storeIds) {
        const lockedStore = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Store" WHERE "id" = ${storeId} FOR UPDATE
        `;
        if (lockedStore.length !== 1) {
          throw new ApiError(
            404,
            "One of the stores in this order no longer exists",
          );
        }
      }

      // Lock product rows in deterministic order before validating price/discount snapshots.
      const productIds = [
        ...new Set(preview.items.map((item) => item.productId)),
      ].sort();
      for (const productId of productIds) {
        const lockedProduct = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Product" WHERE "id" = ${productId} FOR UPDATE
        `;
        if (lockedProduct.length !== 1) {
          throw new ApiError(
            404,
            "One of the products in this order no longer exists",
          );
        }
      }

      const selectedCartItems = await tx.cartItem.findMany({
        where: { id: { in: input.itemIds }, cartId: cart.id },
        select: {
          id: true,
          productId: true,
          quantity: true,
          variant: true,
          product: { select: { storeId: true } },
        },
      });
      if (selectedCartItems.length !== input.itemIds.length) {
        throw new ApiError(
          409,
          "One or more selected cart items are no longer available. Please review your cart",
        );
      }
      assertSameCheckoutItems(selectedCartItems, preview.stores);

      await revalidateOrderItems(
        tx,
        preview.stores.flatMap((storeGroup) =>
          storeGroup.items.map((item) => ({
            productId: item.productId,
            storeId: storeGroup.storeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            originalUnitPrice: item.originalUnitPrice,
            discountAmount: item.discountAmount,
            discountPercentage: item.discountPercentage,
            variant: item.variant,
          })),
        ),
      );

      const createdOrders = [];
      for (const storeGroup of preview.stores) {
        const orderNumber = await createUniqueOrderNumber(tx);
        const store = await tx.store.findUnique({
          where: { id: storeGroup.storeId },
          select: {
            id: true,
            name: true,
            slug: true,
            whatsapp: true,
            location: true,
            status: true,
            isOpen: true,
            ownerId: true,
          },
        });
        if (!store) throw new ApiError(404, "Store not found");
        if (store.status !== "ACTIVE") {
          throw new ApiError(
            400,
            `${store.name} is no longer accepting orders`,
          );
        }
        if (!store.isOpen)
          throw new ApiError(400, `${store.name} is currently closed`);
        if (!store.ownerId)
          throw new ApiError(400, `${store.name} does not have a valid seller`);

        // Each store order gets only its own items' product-discount savings.
        const storeSubtotal = money(storeGroup.subtotal);
        const deliveryFee = money(storeGroup.delivery.deliveryFee);
        const discount = money(storeGroup.discount);
        const total = money(storeSubtotal + deliveryFee - discount);
        if (total <= 0)
          throw new ApiError(400, "Order total must be greater than zero");

        const deliverySnapshot =
          storeGroup.delivery.deliveryType === "DELIVERY"
            ? addressSnapshot
            : {
                type: "PICKUP",
                address: storeGroup.delivery.pickupAddress,
                instructions: storeGroup.delivery.pickupInstructions,
              };

        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            storeId: store.id,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: "WALLET",
            subtotal: storeSubtotal,
            deliveryFee,
            discount,
            total,
            currency: storeGroup.delivery.currency || "NGN",
            deliveryType: storeGroup.delivery.deliveryType,
            deliveryProvider: storeGroup.delivery.provider,
            deliveryAddressSnapshot:
              deliverySnapshot === null
                ? Prisma.JsonNull
                : (deliverySnapshot as Prisma.InputJsonValue),
            deliveryNote: input.deliveryNote?.trim() || null,
            deliveryEstimateMin: storeGroup.delivery.estimatedDays?.min ?? null,
            deliveryEstimateMax: storeGroup.delivery.estimatedDays?.max ?? null,
            sellerDeliveryFee: deliveryFee,
            roaDeliveryFee: 0,
            buyerSnapshot: createBuyerSnapshot(user) as Prisma.InputJsonValue,
            storeSnapshot: createStoreSnapshot(store) as Prisma.InputJsonValue,
            items: {
              create: storeGroup.items.map((item) => ({
                productId: item.productId,
                productName: item.name,
                productSlug: item.slug,
                productImage: item.image,
                quantity: item.quantity,
                // The item snapshot stores the effective discounted price.
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                variant:
                  item.variant === null
                    ? Prisma.JsonNull
                    : (item.variant as Prisma.InputJsonValue),
                status: "ACTIVE",
              })),
            },
          },
        });

        await reserveOrderStock(
          tx,
          storeGroup.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variant:
              item.variant === null ? null : (item.variant as Prisma.JsonValue),
          })),
        );
        await holdWalletForOrder(tx, {
          userId: user.id,
          orderId: order.id,
          amount: total,
          currency: order.currency,
          idempotencyKey: `order:${order.id}:wallet-hold`,
          description: `Wallet payment held for order ${order.orderNumber}`,
        });
        await createEscrowForOrder(tx, order.id);

        const paidOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            tracking: {
              create: {
                status: "PENDING",
                note: "Order placed successfully. Payment received. Awaiting seller confirmation.",
              },
            },
          },
          include: orderInclude,
        });
        createdOrders.push(paidOrder);
      }

      const deletedCartItems = await tx.cartItem.deleteMany({
        where: { cartId: cart.id, id: { in: input.itemIds } },
      });
      if (deletedCartItems.count !== input.itemIds.length) {
        throw new ApiError(
          409,
          "Cart changed while your order was being processed. Please try again",
        );
      }
      return createdOrders;
    },
    { maxWait: 10_000, timeout: 15_000 },
  );

  return {
    orders: orders.map(serializeOrder),
    orderCount: orders.length,
    paymentStatus: "PAID",
    total: money(orders.reduce((sum, order) => sum + Number(order.total), 0)),
    message:
      orders.length === 1
        ? "Order placed successfully"
        : "Orders placed successfully",
  };
}

export async function getOrders(userId: string, query: OrderListQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const where: Prisma.OrderWhereInput = { userId };
  if (query.status) where.status = query.status;
  if (query.search) {
    const search = query.search;
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { store: { name: { contains: search, mode: "insensitive" } } },
      {
        items: {
          some: { productName: { contains: search, mode: "insensitive" } },
        },
      },
    ];
  }
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: orderInclude,
    }),
    prisma.order.count({ where }),
  ]);
  return {
    orders: orders.map(serializeOrder),
    total,
    page,
    limit,
    hasMore: skip + orders.length < total,
  };
}

export async function getOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderInclude,
  });
  if (!order) throw new ApiError(404, "Order not found");
  return serializeOrder(order);
}

export async function cancelOrder(
  userId: string,
  orderId: string,
  input: CancelOrderInput,
) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true, paymentStatus: true },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.status !== "PENDING") {
      throw new ApiError(400, "Only pending orders can be cancelled");
    }
    // Paid PENDING orders must never be cancelled without reversing the payment.
    if (order.paymentStatus === "PAID") {
      throw new ApiError(
        409,
        "Paid order cancellation is not available yet",
        "ORDER_REFUND_NOT_IMPLEMENTED",
      );
    }
    const reason = input.reason?.trim() || "Cancelled by buyer";
    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        items: {
          updateMany: {
            where: { status: "ACTIVE" },
            data: { status: "CANCELLED" },
          },
        },
        tracking: { create: { status: "CANCELLED", note: reason } },
      },
      include: orderInclude,
    });
  });
  return serializeOrder(result);
}

export async function confirmSellerOrder(sellerId: string, orderId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        store: { select: { ownerId: true } },
        escrow: { select: { status: true } },
      },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.store.ownerId !== sellerId) {
      throw new ApiError(
        403,
        "You are not authorized to confirm this order",
        "ORDER_CONFIRMATION_FORBIDDEN",
      );
    }
    if (order.status !== "PENDING") {
      throw new ApiError(
        409,
        "Only pending orders can be confirmed",
        "ORDER_NOT_PENDING",
      );
    }
    if (order.paymentStatus !== "PAID") {
      throw new ApiError(
        409,
        "Order payment must be completed before confirmation",
        "ORDER_NOT_PAID",
      );
    }
    if (order.escrow?.status !== "HELD") {
      throw new ApiError(
        409,
        "Order escrow is not in the expected HELD state",
        "ESCROW_NOT_HELD",
      );
    }
    const updatedCount = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING", paymentStatus: "PAID" },
      data: { status: "CONFIRMED" },
    });
    if (updatedCount.count !== 1) {
      throw new ApiError(
        409,
        "Order has already been processed. Refresh and try again",
        "ORDER_ALREADY_PROCESSED",
      );
    }
    return tx.order.update({
      where: { id: order.id },
      data: {
        tracking: {
          create: { status: "CONFIRMED", note: "Seller confirmed the order." },
        },
      },
      include: orderInclude,
    });
  });
  return serializeOrder(result);
}

export async function dispatchSellerOrder(sellerId: string, orderId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        store: { select: { ownerId: true } },
        escrow: { select: { status: true } },
      },
    });
    if (!order) throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    if (order.store.ownerId !== sellerId) {
      throw new ApiError(
        403,
        "You are not authorized to dispatch this order",
        "ORDER_DISPATCH_FORBIDDEN",
      );
    }
    if (order.status !== "CONFIRMED") {
      throw new ApiError(
        409,
        "Only confirmed orders can be dispatched",
        "ORDER_NOT_CONFIRMED",
      );
    }
    if (order.paymentStatus !== "PAID") {
      throw new ApiError(
        409,
        "Order payment must be completed before dispatch",
        "ORDER_NOT_PAID",
      );
    }
    if (order.escrow?.status !== "HELD") {
      throw new ApiError(
        409,
        "Order escrow is not in the expected HELD state",
        "ESCROW_NOT_HELD",
      );
    }
    const updatedCount = await tx.order.updateMany({
      where: { id: order.id, status: "CONFIRMED", paymentStatus: "PAID" },
      data: { status: "IN_DELIVERY" },
    });
    if (updatedCount.count !== 1) {
      throw new ApiError(
        409,
        "Order has already been processed. Refresh and try again",
        "ORDER_ALREADY_PROCESSED",
      );
    }
    return tx.order.update({
      where: { id: order.id },
      data: {
        tracking: {
          create: {
            status: "IN_DELIVERY",
            note: "Seller dispatched the order.",
          },
        },
      },
      include: orderInclude,
    });
  });
  return serializeOrder(result);
}

/** Buyer receipt confirmation starts the 36-hour inspection window; it does not release escrow. */
export async function confirmBuyerDelivery(buyerId: string, orderId: string) {
  const result = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE
      `;
      const order = await tx.order.findFirst({
        where: { id: orderId, userId: buyerId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          deliveredAt: true,
          escrow: {
            select: { id: true, status: true, releaseEligibleAt: true },
          },
          dispute: { select: { status: true } },
        },
      });
      if (!order) throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");

      // Idempotent retry must not reset the inspection deadline.
      if (order.status === "DELIVERED") {
        if (!order.deliveredAt || !order.escrow?.releaseEligibleAt) {
          throw new ApiError(
            409,
            "The delivered order is missing its confirmation timestamps",
            "DELIVERY_CONFIRMATION_INCOMPLETE",
          );
        }
        return tx.order.findUniqueOrThrow({
          where: { id: order.id },
          include: orderInclude,
        });
      }

      if (
        order.dispute &&
        (order.dispute.status === "OPEN" ||
          order.dispute.status === "UNDER_REVIEW")
      ) {
        throw new ApiError(
          409,
          "Delivery confirmation cannot proceed while a dispute is under review",
          "ACTIVE_DISPUTE_EXISTS",
        );
      }
      if (order.status !== "IN_DELIVERY") {
        throw new ApiError(
          409,
          "Only orders currently in delivery can be confirmed as received",
          "ORDER_NOT_IN_DELIVERY",
        );
      }
      if (order.paymentStatus !== "PAID") {
        throw new ApiError(
          409,
          "The order must be paid before delivery can be confirmed",
          "ORDER_NOT_PAID",
        );
      }
      if (order.escrow?.status !== "HELD") {
        throw new ApiError(
          409,
          "Order escrow is not in the expected HELD state",
          "ESCROW_NOT_HELD",
        );
      }
      if (order.escrow.releaseEligibleAt !== null) {
        throw new ApiError(
          409,
          "The escrow already has a release eligibility deadline",
          "ESCROW_DEADLINE_ALREADY_SET",
        );
      }

      const now = new Date();
      const inspectionWindowMs = 36 * 60 * 60 * 1000;
      const releaseEligibleAt = new Date(now.getTime() + inspectionWindowMs);
      const orderUpdated = await tx.order.updateMany({
        where: {
          id: order.id,
          userId: buyerId,
          status: "IN_DELIVERY",
          paymentStatus: "PAID",
          deliveredAt: null,
        },
        data: { status: "DELIVERED", deliveredAt: now },
      });
      if (orderUpdated.count !== 1) {
        throw new ApiError(
          409,
          "The order has already been processed. Refresh and try again",
          "ORDER_ALREADY_PROCESSED",
        );
      }
      const escrowUpdated = await tx.escrow.updateMany({
        where: { id: order.escrow.id, status: "HELD", releaseEligibleAt: null },
        data: { releaseEligibleAt },
      });
      if (escrowUpdated.count !== 1) {
        throw new ApiError(
          409,
          "The escrow changed while delivery was being confirmed",
          "ESCROW_CONFIRMATION_CONFLICT",
        );
      }
      return tx.order.update({
        where: { id: order.id },
        data: {
          tracking: {
            create: {
              status: "DELIVERED",
              note: "Buyer confirmed receipt. The 36-hour inspection window has started.",
            },
          },
        },
        include: orderInclude,
      });
    },
    { maxWait: 10_000, timeout: 15_000 },
  );
  return serializeOrder(result);
}
