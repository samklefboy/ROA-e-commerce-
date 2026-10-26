import { Prisma } from "../../generated/prisma/client.js";
import { ApiError } from "../utils/api-error.js";

type OrderStockItem = {
  productId: string;
  quantity: number;
  variant: Prisma.JsonValue | null;
};

type VariantInput = Record<string, string>;

function normalizeVariant(
  variant: Prisma.JsonValue | null,
): VariantInput | null {
  if (
    variant === null ||
    typeof variant !== "object" ||
    Array.isArray(variant)
  ) {
    return null;
  }

  const result: VariantInput = {};

  for (const [key, value] of Object.entries(variant)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function createVariantKey(variant: VariantInput | null): string | null {
  if (!variant) {
    return null;
  }

  return Object.entries(variant)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
}

function getProductVariantKey(combination: Prisma.JsonValue): string | null {
  return createVariantKey(normalizeVariant(combination));
}

/**
 * Reserves stock for an order.
 *
 * This should be called inside the same Prisma transaction
 * that handles the successful payment.
 */
export async function reserveOrderStock(
  tx: Prisma.TransactionClient,
  items: OrderStockItem[],
) {
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new ApiError(400, "Invalid order quantity");
    }

    const product = await tx.product.findUnique({
      where: {
        id: item.productId,
      },
      include: {
        productVariants: true,
      },
    });

    if (!product) {
      throw new ApiError(
        404,
        "One of the products in this order no longer exists",
      );
    }

    if (product.status !== "ACTIVE") {
      throw new ApiError(400, `${product.name} is no longer available`);
    }

    if (product.hasVariants) {
      const selectedVariant = findMatchingVariant(
        product.productVariants,
        item.variant,
      );

      if (!selectedVariant) {
        throw new ApiError(
          400,
          `The selected variant for ${product.name} is no longer available`,
        );
      }

      const updated = await tx.productVariant.updateMany({
        where: {
          id: selectedVariant.id,
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (updated.count !== 1) {
        throw new ApiError(400, `Insufficient stock for ${product.name}`);
      }
    } else {
      if (product.stock !== null && product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.name}`);
      }

      if (product.stock !== null) {
        const updated = await tx.product.updateMany({
          where: {
            id: product.id,
            status: "ACTIVE",
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updated.count !== 1) {
          throw new ApiError(400, `Insufficient stock for ${product.name}`);
        }
      }
    }
  }
}

/**
 * Releases previously reserved stock.
 *
 * Used when a successfully paid order is refunded/cancelled
 * before the stock has actually been fulfilled.
 */

/**
 * Releases previously reserved stock.
 *
 * Used when a successfully paid order is refunded/cancelled
 * before the stock has actually been fulfilled.
 *
 * Must run inside the same transaction as the cancellation/refund.
 * Missing inventory records are errors, not silent skips.
 */
export async function releaseOrderStock(
  tx: Prisma.TransactionClient,
  items: OrderStockItem[],
) {
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new ApiError(
        409,
        "Cannot restore stock for an invalid order quantity",
        "ORDER_STOCK_RELEASE_QUANTITY_INVALID",
      );
    }

    const product = await tx.product.findUnique({
      where: {
        id: item.productId,
      },
      include: {
        productVariants: true,
      },
    });

    if (!product) {
      throw new ApiError(
        409,
        "Cannot restore stock because an order product no longer exists",
        "ORDER_STOCK_RELEASE_PRODUCT_NOT_FOUND",
      );
    }

    if (product.hasVariants) {
      const selectedVariant = findMatchingVariant(
        product.productVariants,
        item.variant,
      );

      if (!selectedVariant) {
        throw new ApiError(
          409,
          "Cannot restore stock because the order variant no longer exists",
          "ORDER_STOCK_RELEASE_VARIANT_NOT_FOUND",
        );
      }

      const updated = await tx.productVariant.updateMany({
        where: {
          id: selectedVariant.id,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      if (updated.count !== 1) {
        throw new ApiError(
          409,
          "The reserved variant stock could not be restored",
          "ORDER_STOCK_RELEASE_VARIANT_FAILED",
        );
      }
    } else if (product.stock !== null) {
      const updated = await tx.product.updateMany({
        where: {
          id: product.id,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      if (updated.count !== 1) {
        throw new ApiError(
          409,
          "The reserved product stock could not be restored",
          "ORDER_STOCK_RELEASE_PRODUCT_FAILED",
        );
      }
    }

    // A product with stock === null has unlimited stock.
    // reserveOrderStock() did not decrement it, so nothing is restored.
  }
}

function findMatchingVariant(
  variants: Array<{
    id: string;
    combination: Prisma.JsonValue;
  }>,
  variant: Prisma.JsonValue | null,
) {
  const selectedKey = createVariantKey(normalizeVariant(variant));

  if (!selectedKey) {
    return null;
  }

  return (
    variants.find(
      (productVariant) =>
        getProductVariantKey(productVariant.combination) === selectedKey,
    ) ?? null
  );
}
