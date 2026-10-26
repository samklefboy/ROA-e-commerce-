import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { synchronizeProductDiscount } from "./product-discount.service.js";

type VariantInput = Record<string, string>;

type AddToCartInput = {
  productId: string;
  quantity?: number;
  variant?: VariantInput | null;
};

type UpdateCartItemInput = {
  quantity: number;
};

const cartItemInclude = {
  product: {
    include: {
      productVariants: true,
      discount: {
        include: {
          variantPriceSnapshots: true,
        },
      },
    },
  },
  store: true,
} satisfies Prisma.CartItemInclude;

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function decimalToNumber(value: unknown): number {
  return Number(value);
}

function normalizeVariant(variant?: VariantInput | null): VariantInput | null {
  if (!variant) return null;

  const entries = Object.entries(variant)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return null;

  return Object.fromEntries(entries);
}

function createVariantKey(variant?: VariantInput | null): string | null {
  const normalized = normalizeVariant(variant);

  if (!normalized) return null;

  return Object.entries(normalized)
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
}

function getSelectedVariant(item: any) {
  if (!item.product?.hasVariants || !item.variantKey) {
    return null;
  }

  return (
    item.product.productVariants.find(
      (variant: any) =>
        createVariantKey(variant.combination as VariantInput) ===
        item.variantKey,
    ) ?? null
  );
}

function getEffectivePricing(item: any) {
  const product = item.product;

  if (!product) {
    const price = decimalToNumber(item.unitPrice);

    return {
      price,
      oldPrice: null,
      discountPercentage: null,
    };
  }

  const selectedVariant = getSelectedVariant(item);
  const discount = product.discount;

  // Product.oldPrice is set by the discount service only when the
  // product discount has actually been applied.
  const discountApplied =
    discount?.status === "ACTIVE" &&
    product.oldPrice !== null &&
    product.oldPrice !== undefined;

  if (selectedVariant) {
    const snapshot = discountApplied
      ? discount.variantPriceSnapshots.find(
          (entry: any) => entry.productVariantId === selectedVariant.id,
        )
      : null;

    return {
      price: decimalToNumber(selectedVariant.price),
      oldPrice: snapshot ? decimalToNumber(snapshot.originalPrice) : null,
      discountPercentage: snapshot ? discount.percentage : null,
    };
  }

  return {
    price: decimalToNumber(product.price),
    oldPrice: discountApplied ? decimalToNumber(product.oldPrice) : null,
    discountPercentage: discountApplied ? discount.percentage : null,
  };
}

function serializeCartItem(item: any) {
  const pricing = getEffectivePricing(item);
  const price = pricing.price;

  return {
    id: item.id,
    cartId: item.cartId,

    productId: item.productId,
    storeId: item.storeId,

    quantity: item.quantity,

    // Always show the latest effective product/variant price,
    // not the potentially stale CartItem.unitPrice value.
    price,
    unitPrice: price,
    oldPrice: pricing.oldPrice,
    discountPercentage: pricing.discountPercentage,
    subtotal: money(price * item.quantity),

    variant: item.variant ?? null,

    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          description: item.product.description,
          images: item.product.images,
          price: decimalToNumber(item.product.price),
          oldPrice:
            item.product.oldPrice !== null &&
            item.product.oldPrice !== undefined
              ? decimalToNumber(item.product.oldPrice)
              : null,
          discountPercentage:
            item.product.discount?.status === "ACTIVE" &&
            item.product.oldPrice !== null &&
            item.product.oldPrice !== undefined
              ? item.product.discount.percentage
              : null,
          condition: item.product.condition,
          stock: item.product.stock,
          hasVariants: item.product.hasVariants,
          variants: item.product.variants,
          status: item.product.status,
        }
      : null,

    store: item.store
      ? {
          id: item.store.id,
          name: item.store.name,
          slug: item.store.slug,
          isVerified: item.store.isVerified,
          isOpen: item.store.isOpen,
          deliveryDaysMin: item.store.deliveryDaysMin,
          deliveryDaysMax: item.store.deliveryDaysMax,
          pickupEnabled: item.store.pickupEnabled,
          pickupAddress: item.store.pickupEnabled
            ? item.store.pickupAddress
            : null,
          pickupInstructions: item.store.pickupEnabled
            ? item.store.pickupInstructions
            : null,
        }
      : null,
  };
}

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

async function synchronizeCartDiscounts(cartId: string) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    select: { productId: true },
  });

  const productIds = [...new Set(items.map((item) => item.productId))];

  // Synchronize scheduled/expired discounts before returning cart prices.
  await Promise.all(
    productIds.map((productId) => synchronizeProductDiscount(productId)),
  );
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  await synchronizeCartDiscounts(cart.id);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: "asc" },
    include: cartItemInclude,
  });

  return {
    id: cart.id,
    items: items.map(serializeCartItem),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
  };
}

export async function addToCart(userId: string, input: AddToCartInput) {
  const quantity = input.quantity ?? 1;

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  await synchronizeProductDiscount(input.productId);

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: {
      store: true,
      productVariants: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.status !== "ACTIVE") {
    throw new ApiError(400, "This product is not currently available");
  }

  if (product.store.status !== "ACTIVE" || !product.store.isOpen) {
    throw new ApiError(400, "This store is not currently accepting orders");
  }

  const normalizedVariant = normalizeVariant(input.variant);

  let price = decimalToNumber(product.price);
  let stock = product.stock;

  if (product.hasVariants) {
    if (!normalizedVariant) {
      throw new ApiError(400, "Please select a product variant");
    }

    const variantKey = createVariantKey(normalizedVariant);

    const selectedVariant = product.productVariants.find(
      (variant) =>
        createVariantKey(variant.combination as VariantInput) === variantKey,
    );

    if (!selectedVariant) {
      throw new ApiError(400, "The selected product variant is not available");
    }

    price = decimalToNumber(selectedVariant.price);
    stock = selectedVariant.stock;
  } else if (normalizedVariant) {
    throw new ApiError(400, "This product does not have selectable variants");
  }

  if (stock !== null && quantity > stock) {
    throw new ApiError(
      400,
      `Only ${stock} item${stock === 1 ? "" : "s"} available`,
    );
  }

  const cart = await getOrCreateCart(userId);
  const variantKey = createVariantKey(normalizedVariant);

  const existingItems = await prisma.cartItem.findMany({
    where: {
      cartId: cart.id,
      productId: product.id,
    },
  });

  const existingItem = existingItems.find(
    (item) => (item.variantKey ?? null) === variantKey,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (stock !== null && newQuantity > stock) {
      throw new ApiError(
        400,
        `Only ${stock} item${stock === 1 ? "" : "s"} available`,
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        unitPrice: price,
      },
      include: cartItemInclude,
    });

    return serializeCartItem(updated);
  }

  const created = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      storeId: product.storeId,
      quantity,
      unitPrice: price,
      variantKey,
      variant: normalizedVariant ?? Prisma.JsonNull,
    },
    include: cartItemInclude,
  });

  return serializeCartItem(created);
}

export async function updateCartItem(
  userId: string,
  cartItemId: string,
  input: UpdateCartItemInput,
) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Find ownership first so only this user's product discount is
  // synchronized and the caller cannot update another user's cart.
  const reference = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: { userId },
    },
    select: { productId: true },
  });

  if (!reference) {
    throw new ApiError(404, "Cart item not found");
  }

  await synchronizeProductDiscount(reference.productId);

  const item = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: { userId },
    },
    include: cartItemInclude,
  });

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  if (item.product.status !== "ACTIVE") {
    throw new ApiError(400, "This product is no longer available");
  }

  if (item.store.status !== "ACTIVE" || !item.store.isOpen) {
    throw new ApiError(400, "This store is not currently accepting orders");
  }

  let availableStock = item.product.stock;
  const selectedVariant = getSelectedVariant(item);

  if (item.product.hasVariants) {
    if (!selectedVariant) {
      throw new ApiError(400, "This product variant is no longer available");
    }

    availableStock = selectedVariant.stock;
  }

  if (availableStock !== null && input.quantity > availableStock) {
    throw new ApiError(
      400,
      `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available`,
    );
  }

  const currentPrice = getEffectivePricing(item).price;

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: {
      quantity: input.quantity,
      unitPrice: currentPrice,
    },
    include: cartItemInclude,
  });

  return serializeCartItem(updated);
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const item = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: { userId },
    },
  });

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  await prisma.cartItem.delete({
    where: { id: item.id },
  });

  return {
    id: item.id,
    message: "Cart item removed successfully",
  };
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    return { message: "Cart is already empty" };
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return { message: "Cart cleared successfully" };
}
