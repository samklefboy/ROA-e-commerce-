import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type {
  CheckoutInput,
  DeliveryQuoteInput,
} from "../utils/validators/checkout.validation.js";
import { getStateByCode, getZoneByStateCode } from "../config/location.js";
import { synchronizeProductDiscount } from "./product-discount.service.js";

type DeliveryType = "DELIVERY" | "PICKUP";
type VariantInput = Record<string, string>;

type PreparedCheckoutItem = {
  cartItemId: string;
  productId: string;
  storeId: string;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  /** Effective price charged per unit after any active product discount. */
  unitPrice: number;
  /** Original per-unit price before any product discount. */
  originalUnitPrice: number;
  /** Total product-discount savings for this cart line. */
  discountAmount: number;
  discountPercentage: number | null;
  /** Line subtotal at the effective price charged to the buyer. */
  subtotal: number;
  variant: VariantInput | null;
};

type PreparedStore = {
  storeId: string;
  storeName: string;
  /** Store's gross item subtotal before product discounts. */
  subtotal: number;
  /** Product-discount savings attributable to this store only. */
  discount: number;
  items: PreparedCheckoutItem[];
  delivery: {
    deliveryType: DeliveryType;
    deliveryFee: number;
    currency: string;
    provider: "SELLER" | "ROA" | "THIRD_PARTY" | null;
    estimatedDays: { min: number | null; max: number | null } | null;
    pickupAddress: string | null;
    pickupInstructions: string | null;
  };
};

const DEFAULT_CURRENCY = "NGN";

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeVariant(
  variant: VariantInput | null | undefined,
): VariantInput | null {
  if (!variant) return null;

  const entries = Object.entries(variant)
    .filter(
      ([key, value]) =>
        key.trim().length > 0 &&
        typeof value === "string" &&
        value.trim().length > 0,
    )
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  return entries.length ? Object.fromEntries(entries) : null;
}

function createVariantKey(variant: VariantInput | null): string {
  if (!variant) return "";
  return Object.entries(variant)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
}

function jsonToVariant(value: Prisma.JsonValue | null): VariantInput | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const result: VariantInput = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "string") result[key] = rawValue;
  }
  return normalizeVariant(result);
}

function getFirstProductImage(images: Prisma.JsonValue): string | null {
  if (!Array.isArray(images)) return null;
  const firstImage = images[0];
  return typeof firstImage === "string" ? firstImage : null;
}

/** Resolve delivery rules in STATE -> ZONE -> NATIONWIDE order. */
async function resolveDeliveryRule(storeId: string, stateCode: string) {
  const normalizedStateCode = stateCode.trim().toUpperCase();
  const state = getStateByCode(normalizedStateCode);
  if (!state) throw new ApiError(400, "Invalid Nigerian state code");

  const zoneCode = getZoneByStateCode(normalizedStateCode);
  const rules = await prisma.deliveryRule.findMany({
    where: { storeId, isActive: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  const stateRule = rules.find(
    (rule) =>
      rule.scope === "STATE" &&
      rule.stateCode?.trim().toUpperCase() === normalizedStateCode,
  );
  if (stateRule) return stateRule;

  if (zoneCode) {
    const zoneRule = rules.find(
      (rule) =>
        rule.scope === "ZONE" &&
        rule.zoneCode?.trim().toUpperCase() === zoneCode.trim().toUpperCase(),
    );
    if (zoneRule) return zoneRule;
  }

  return rules.find((rule) => rule.scope === "NATIONWIDE") ?? null;
}

/** The selected address must belong to the authenticated buyer. */
async function getCheckoutAddress(
  userId: string,
  addressId: string | null | undefined,
) {
  if (!addressId) return null;

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address)
    throw new ApiError(400, "Selected delivery address was not found");
  if (address.countryCode !== "NG") {
    throw new ApiError(
      400,
      "Currently, checkout is only available for Nigerian addresses",
    );
  }
  if (!address.stateCode || !getStateByCode(address.stateCode)) {
    throw new ApiError(
      400,
      "Your selected address does not have a valid Nigerian state code",
    );
  }
  return address;
}

export async function getDeliveryQuote(
  userId: string,
  input: DeliveryQuoteInput,
) {
  const store = await prisma.store.findUnique({
    where: { id: input.storeId },
    select: {
      id: true,
      name: true,
      status: true,
      isOpen: true,
      pickupEnabled: true,
      pickupAddress: true,
      pickupInstructions: true,
      deliveryDaysMin: true,
      deliveryDaysMax: true,
    },
  });

  if (!store) throw new ApiError(404, "Store not found");
  if (store.status !== "ACTIVE") {
    throw new ApiError(400, `${store.name} is not currently accepting orders`);
  }
  if (!store.isOpen)
    throw new ApiError(400, `${store.name} is currently closed`);

  if (input.type === "PICKUP") {
    if (!store.pickupEnabled) {
      throw new ApiError(400, `${store.name} does not support pickup`);
    }
    if (!store.pickupAddress) {
      throw new ApiError(
        400,
        `${store.name} has not configured a pickup address`,
      );
    }
    return {
      storeId: store.id,
      storeName: store.name,
      deliveryType: "PICKUP" as const,
      deliveryFee: 0,
      currency: DEFAULT_CURRENCY,
      provider: null,
      estimatedDays: null,
      pickupAddress: store.pickupAddress,
      pickupInstructions: store.pickupInstructions,
    };
  }

  if (input.type === "DELIVERY") {
    if (!input.addressId)
      throw new ApiError(400, "Address is required for delivery");
    const address = await getCheckoutAddress(userId, input.addressId);
    if (!address?.stateCode) {
      throw new ApiError(400, "Selected address does not have a valid state");
    }

    const stateCode = address.stateCode.trim().toUpperCase();
    const zoneCode = getZoneByStateCode(stateCode);
    if (!zoneCode) {
      throw new ApiError(
        400,
        "Unable to determine delivery zone for selected address",
      );
    }

    const deliveryRule = await resolveDeliveryRule(store.id, stateCode);
    if (!deliveryRule) {
      throw new ApiError(
        400,
        `${store.name} does not currently deliver to your selected location`,
      );
    }

    return {
      storeId: store.id,
      storeName: store.name,
      deliveryType: "DELIVERY" as const,
      deliveryFee: money(Number(deliveryRule.fee)),
      currency: deliveryRule.currency || DEFAULT_CURRENCY,
      provider: "SELLER" as const,
      estimatedDays: { min: store.deliveryDaysMin, max: store.deliveryDaysMax },
      pickupAddress: null,
      pickupInstructions: null,
    };
  }

  throw new ApiError(400, "Invalid delivery type");
}

/** Promo codes are deliberately unavailable until their backend is implemented. */
async function calculateDiscount(input: {
  userId: string;
  subtotal: number;
  promoCode?: string | null;
}) {
  const promoCode = input.promoCode?.trim();
  if (!promoCode) return { amount: 0, code: null, message: null };
  throw new ApiError(400, "Promo codes are not currently available");
}

async function loadCheckoutCartItems(
  userId: string,
  requestedItemIds: CheckoutInput["itemIds"],
) {
  const uniqueItemIds = new Set(requestedItemIds);
  if (uniqueItemIds.size !== requestedItemIds.length) {
    throw new ApiError(400, "Duplicate cart items are not allowed");
  }

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new ApiError(404, "Cart not found");

  const selectedReferences = await prisma.cartItem.findMany({
    where: { id: { in: requestedItemIds }, cartId: cart.id },
    select: { productId: true },
  });

  // Synchronize scheduled/expired discounts before reading authoritative prices.
  await Promise.all(
    [...new Set(selectedReferences.map((item) => item.productId))].map(
      (productId) => synchronizeProductDiscount(productId),
    ),
  );

  const cartItems = await prisma.cartItem.findMany({
    where: { id: { in: requestedItemIds }, cartId: cart.id },
    include: {
      product: {
        include: {
          store: true,
          productVariants: true,
          discount: { include: { variantPriceSnapshots: true } },
        },
      },
      store: true,
    },
  });

  if (cartItems.length !== requestedItemIds.length) {
    throw new ApiError(400, "One or more selected cart items are invalid");
  }
  return { cart, cartItems };
}

function findMatchingProductVariant(
  product: {
    productVariants: Array<{
      id: string;
      combination: Prisma.JsonValue;
      price: Prisma.Decimal;
      stock: number;
      sku: string;
    }>;
  },
  cartVariant: VariantInput,
) {
  const requestedKey = createVariantKey(normalizeVariant(cartVariant));
  return (
    product.productVariants.find(
      (productVariant) =>
        createVariantKey(jsonToVariant(productVariant.combination)) ===
        requestedKey,
    ) ?? null
  );
}

function prepareCartItem(
  requestedQuantity: number,
  cartItem: {
    id: string;
    quantity: number;
    variant: Prisma.JsonValue | null;
    product: {
      id: string;
      name: string;
      slug: string;
      images: Prisma.JsonValue;
      price: Prisma.Decimal;
      oldPrice: Prisma.Decimal | null;
      stock: number | null;
      status: string;
      hasVariants: boolean;
      productVariants: Array<{
        id: string;
        combination: Prisma.JsonValue;
        price: Prisma.Decimal;
        stock: number;
        sku: string;
      }>;
      discount: {
        percentage: number;
        status: string;
        startsAt: Date;
        endsAt: Date | null;
        variantPriceSnapshots: Array<{
          productVariantId: string;
          originalPrice: Prisma.Decimal;
        }>;
      } | null;
    };
    store: { id: string; name: string; status: string; isOpen: boolean };
  },
): PreparedCheckoutItem {
  if (cartItem.product.status !== "ACTIVE") {
    throw new ApiError(400, `${cartItem.product.name} is no longer available`);
  }
  if (cartItem.store.status !== "ACTIVE") {
    throw new ApiError(
      400,
      `${cartItem.store.name} is not currently accepting orders`,
    );
  }
  if (!cartItem.store.isOpen) {
    throw new ApiError(400, `${cartItem.store.name} is currently closed`);
  }
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw new ApiError(400, `Invalid quantity for ${cartItem.product.name}`);
  }
  if (requestedQuantity > cartItem.quantity) {
    throw new ApiError(
      400,
      `You cannot checkout more than ${cartItem.quantity} unit(s) of ${cartItem.product.name}`,
    );
  }

  const selectedVariant = jsonToVariant(cartItem.variant);
  let unitPrice = Number(cartItem.product.price);
  let originalUnitPrice = unitPrice;
  let returnedVariant: VariantInput | null = selectedVariant;

  const discount = cartItem.product.discount;
  const now = Date.now();
  const discountIsApplied =
    discount?.status === "ACTIVE" &&
    discount.startsAt.getTime() <= now &&
    (discount.endsAt === null || discount.endsAt.getTime() > now);

  if (cartItem.product.hasVariants) {
    if (!selectedVariant) {
      throw new ApiError(
        400,
        `Please select a variant for ${cartItem.product.name}`,
      );
    }
    const productVariant = findMatchingProductVariant(
      cartItem.product,
      selectedVariant,
    );
    if (!productVariant) {
      throw new ApiError(
        400,
        `The selected variant for ${cartItem.product.name} is no longer available`,
      );
    }
    unitPrice = Number(productVariant.price);
    if (productVariant.stock < requestedQuantity) {
      throw new ApiError(
        400,
        `Only ${productVariant.stock} unit(s) of ${cartItem.product.name} are currently available`,
      );
    }

    if (discountIsApplied) {
      const snapshot = discount.variantPriceSnapshots.find(
        (entry) => entry.productVariantId === productVariant.id,
      );
      if (!snapshot) {
        throw new ApiError(
          409,
          `Discount pricing for ${cartItem.product.name} needs to be refreshed`,
          "CHECKOUT_DISCOUNT_PRICE_INVALID",
        );
      }
      originalUnitPrice = Number(snapshot.originalPrice);
    }
    returnedVariant = jsonToVariant(productVariant.combination);
  } else {
    if (
      cartItem.product.stock !== null &&
      cartItem.product.stock < requestedQuantity
    ) {
      throw new ApiError(
        400,
        `Only ${cartItem.product.stock} unit(s) of ${cartItem.product.name} are currently available`,
      );
    }
    if (discountIsApplied) {
      if (cartItem.product.oldPrice === null) {
        throw new ApiError(
          409,
          `Discount pricing for ${cartItem.product.name} needs to be refreshed`,
          "CHECKOUT_DISCOUNT_PRICE_INVALID",
        );
      }
      originalUnitPrice = Number(cartItem.product.oldPrice);
    }
    returnedVariant = null;
  }

  const itemSubtotal = money(unitPrice * requestedQuantity);
  const discountAmount = money(
    Math.max(0, originalUnitPrice - unitPrice) * requestedQuantity,
  );

  return {
    cartItemId: cartItem.id,
    productId: cartItem.product.id,
    storeId: cartItem.store.id,
    name: cartItem.product.name,
    slug: cartItem.product.slug,
    image: getFirstProductImage(cartItem.product.images),
    quantity: requestedQuantity,
    unitPrice,
    originalUnitPrice,
    discountAmount,
    discountPercentage:
      discountAmount > 0 && discountIsApplied ? discount!.percentage : null,
    subtotal: itemSubtotal,
    variant: returnedVariant,
  };
}

function groupItemsByStore(
  items: PreparedCheckoutItem[],
  cartItems: Array<{ id: string; store: { id: string; name: string } }>,
) {
  const cartStoreMap = new Map<string, { id: string; name: string }>();
  for (const item of cartItems) cartStoreMap.set(item.store.id, item.store);

  const grouped = new Map<
    string,
    { store: { id: string; name: string }; items: PreparedCheckoutItem[] }
  >();

  for (const item of items) {
    const store = cartStoreMap.get(item.storeId);
    if (!store)
      throw new ApiError(400, "Store information could not be resolved");
    if (!grouped.has(item.storeId))
      grouped.set(item.storeId, { store, items: [] });
    grouped.get(item.storeId)!.items.push(item);
  }
  return grouped;
}

export async function previewCheckout(userId: string, input: CheckoutInput) {
  if (!input.itemIds || input.itemIds.length === 0) {
    throw new ApiError(400, "Select at least one cart item");
  }

  const { cart, cartItems } = await loadCheckoutCartItems(
    userId,
    input.itemIds,
  );
  const preparedItems: PreparedCheckoutItem[] = [];

  for (const cartItemId of input.itemIds) {
    const cartItem = cartItems.find((item) => item.id === cartItemId);
    if (!cartItem) {
      throw new ApiError(
        400,
        "One or more selected cart items could not be found",
      );
    }
    preparedItems.push(prepareCartItem(cartItem.quantity, cartItem));
  }

  const grouped = groupItemsByStore(preparedItems, cartItems);
  const subtotal = money(
    preparedItems.reduce(
      (sum, item) => sum + item.originalUnitPrice * item.quantity,
      0,
    ),
  );
  const productDiscount = money(
    preparedItems.reduce((sum, item) => sum + item.discountAmount, 0),
  );
  const discountedSubtotal = money(subtotal - productDiscount);

  let address: Awaited<ReturnType<typeof getCheckoutAddress>> | null = null;
  const stores: PreparedStore[] = [];
  let deliveryFee = 0;
  let hasDelivery = false;

  for (const [storeId, group] of grouped.entries()) {
    const selection = input.delivery?.[storeId];
    if (!selection) {
      throw new ApiError(
        400,
        `Please select a delivery method for ${group.store.name}`,
      );
    }
    const deliveryType = selection.type;

    if (deliveryType === "DELIVERY") {
      hasDelivery = true;
      if (!input.addressId)
        throw new ApiError(400, "A delivery address is required");
      if (!address) address = await getCheckoutAddress(userId, input.addressId);
    }

    const quote = await getDeliveryQuote(userId, {
      storeId,
      type: deliveryType,
      addressId: deliveryType === "DELIVERY" ? input.addressId : undefined,
    });

    const storeSubtotal = money(
      group.items.reduce(
        (sum, item) => sum + item.originalUnitPrice * item.quantity,
        0,
      ),
    );
    const storeDiscount = money(
      group.items.reduce((sum, item) => sum + item.discountAmount, 0),
    );

    deliveryFee = money(deliveryFee + quote.deliveryFee);
    stores.push({
      storeId,
      storeName: group.store.name,
      subtotal: storeSubtotal,
      discount: storeDiscount,
      items: group.items,
      delivery: {
        deliveryType: quote.deliveryType,
        deliveryFee: quote.deliveryFee,
        currency: quote.currency,
        provider: quote.provider,
        estimatedDays: quote.estimatedDays,
        pickupAddress: quote.pickupAddress,
        pickupInstructions: quote.pickupInstructions,
      },
    });
  }

  if (hasDelivery && !address)
    throw new ApiError(400, "A delivery address is required");

  const promoDiscount = await calculateDiscount({
    userId,
    subtotal: discountedSubtotal,
    promoCode: input.promoCode ?? null,
  });
  const combinedDiscount = money(productDiscount + promoDiscount.amount);
  const total = money(subtotal + deliveryFee - combinedDiscount);
  if (total < 0) throw new ApiError(400, "Checkout total cannot be negative");

  return {
    cartId: cart.id,
    currency: DEFAULT_CURRENCY,
    items: preparedItems,
    stores,
    subtotal,
    deliveryFee,
    discount: combinedDiscount,
    productDiscount,
    promoDiscount: promoDiscount.amount,
    total,
    promo: { code: promoDiscount.code, message: promoDiscount.message },
    address: address
      ? {
          id: address.id,
          recipientName: address.recipientName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          stateCode: address.stateCode,
          countryCode: address.countryCode,
          landmark: address.landmark,
        }
      : null,
    paymentMethod: input.paymentMethod,
    deliveryNote: input.deliveryNote?.trim() || null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
}
