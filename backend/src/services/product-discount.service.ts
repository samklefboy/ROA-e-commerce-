import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

type Transaction = Prisma.TransactionClient;

export type ProductDiscountInput = {
  percentage: number;
  startsAt?: Date | undefined;
  endsAt?: Date | null | undefined;
};

const discountInclude = {
  product: {
    include: {
      productVariants: true,
    },
  },
  variantPriceSnapshots: true,
} as const;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function discountedPrice(price: number, percentage: number): number {
  return roundMoney((price * (100 - percentage)) / 100);
}

function validateDiscountDates(startsAt: Date, endsAt?: Date | null) {
  if (Number.isNaN(startsAt.getTime())) {
    throw new ApiError(400, "Invalid discount start date");
  }

  if (endsAt && Number.isNaN(endsAt.getTime())) {
    throw new ApiError(400, "Invalid discount end date");
  }

  if (endsAt && endsAt <= startsAt) {
    throw new ApiError(
      400,
      "The discount end date must be after its start date",
    );
  }
}

async function findDiscountProduct(
  tx: Transaction,
  productId: string,
  storeId: string,
) {
  const product = await tx.product.findFirst({
    where: {
      id: productId,
      storeId,
    },
    include: {
      productVariants: true,
      discount: true,
      store: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found in your store");
  }

  if (product.store.status !== "ACTIVE") {
    throw new ApiError(403, "Your store must be active to manage discounts");
  }

  if (product.status !== "ACTIVE") {
    throw new ApiError(400, "Only active products can have discounts");
  }

  if (product.hasVariants && product.productVariants.length === 0) {
    throw new ApiError(400, "This product has no configured variants");
  }

  return product;
}

async function restoreDiscountPrices(
  tx: Transaction,
  discount: {
    id: string;
    productId: string;
    originalPrice: Prisma.Decimal;
    variantPriceSnapshots: {
      productVariantId: string;
      originalPrice: Prisma.Decimal;
    }[];
  },
) {
  await tx.product.update({
    where: { id: discount.productId },
    data: {
      price: Number(discount.originalPrice),
      oldPrice: null,
    },
  });

  for (const snapshot of discount.variantPriceSnapshots) {
    await tx.productVariant.updateMany({
      where: {
        id: snapshot.productVariantId,
      },
      data: {
        price: Number(snapshot.originalPrice),
      },
    });
  }

  await tx.productDiscount.update({
    where: { id: discount.id },
    data: { status: "ENDED" },
  });
}

async function applyDiscountPrices(
  tx: Transaction,
  discount: {
    id: string;
    productId: string;
    percentage: number;
    originalPrice: Prisma.Decimal;
    variantPriceSnapshots: {
      productVariantId: string;
      originalPrice: Prisma.Decimal;
    }[];
  },
) {
  const originalPrice = Number(discount.originalPrice);

  await tx.product.update({
    where: { id: discount.productId },
    data: {
      price: discountedPrice(originalPrice, discount.percentage),
      oldPrice: originalPrice,
    },
  });

  for (const snapshot of discount.variantPriceSnapshots) {
    await tx.productVariant.updateMany({
      where: {
        id: snapshot.productVariantId,
      },
      data: {
        price: discountedPrice(
          Number(snapshot.originalPrice),
          discount.percentage,
        ),
      },
    });
  }
}

/**
 * Synchronizes one discount with its schedule.
 *
 * Call this before presenting a discount as active and from checkout
 * before validating the payable price.
 */
export async function synchronizeProductDiscount(productId: string) {
  return prisma.$transaction(async (tx) => {
    const discount = await tx.productDiscount.findUnique({
      where: { productId },
      include: discountInclude,
    });

    if (!discount || discount.status !== "ACTIVE") {
      return discount;
    }

    const now = new Date();

    if (discount.endsAt && discount.endsAt <= now) {
      await restoreDiscountPrices(tx, discount);
      return tx.productDiscount.findUnique({
        where: { productId },
        include: discountInclude,
      });
    }

    if (discount.startsAt <= now && discount.product.oldPrice === null) {
      await applyDiscountPrices(tx, discount);
    }

    return tx.productDiscount.findUnique({
      where: { productId },
      include: discountInclude,
    });
  });
}

export async function createProductDiscount(
  productId: string,
  storeId: string,
  input: ProductDiscountInput,
) {
  if (
    !Number.isInteger(input.percentage) ||
    input.percentage < 1 ||
    input.percentage > 90
  ) {
    throw new ApiError(400, "Discount percentage must be between 1 and 90");
  }

  const startsAt = input.startsAt ?? new Date();
  const endsAt = input.endsAt ?? null;

  validateDiscountDates(startsAt, endsAt);

  if (endsAt && endsAt <= new Date()) {
    throw new ApiError(400, "The discount end date must be in the future");
  }

  return prisma.$transaction(async (tx) => {
    const product = await findDiscountProduct(tx, productId, storeId);

    if (product.discount?.status === "ACTIVE") {
      throw new ApiError(409, "This product already has an active discount");
    }

    const originalPrice = Number(
      product.discount?.originalPrice ?? product.price,
    );

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      throw new ApiError(400, "The product must have a valid regular price");
    }

    const existingDiscount = await tx.productDiscount.findUnique({
      where: { productId },
    });

    if (existingDiscount) {
      await tx.productDiscount.delete({
        where: { productId },
      });
    }

    const discount = await tx.productDiscount.create({
      data: {
        storeId,
        productId,
        percentage: input.percentage,
        originalPrice,
        status: "ACTIVE",
        startsAt,
        endsAt,
      },
    });

    if (product.productVariants.length > 0) {
      await tx.productDiscountVariantPrice.createMany({
        data: product.productVariants.map((variant) => ({
          discountId: discount.id,
          productVariantId: variant.id,
          originalPrice: Number(variant.price),
        })),
      });
    }

    const result = await tx.productDiscount.findUniqueOrThrow({
      where: { productId },
      include: discountInclude,
    });

    if (startsAt <= new Date()) {
      await applyDiscountPrices(tx, result);
    }

    return tx.productDiscount.findUniqueOrThrow({
      where: { productId },
      include: discountInclude,
    });
  });
}

export async function updateProductDiscount(
  productId: string,
  storeId: string,
  input: ProductDiscountInput,
) {
  await synchronizeProductDiscount(productId);

  return prisma.$transaction(async (tx) => {
    const product = await findDiscountProduct(tx, productId, storeId);

    const existing = await tx.productDiscount.findUnique({
      where: { productId },
      include: discountInclude,
    });

    if (!existing) {
      throw new ApiError(404, "No discount exists for this product");
    }

    const percentage = input.percentage ?? existing.percentage;
    const startsAt = input.startsAt ?? existing.startsAt;
    const endsAt = input.endsAt === undefined ? existing.endsAt : input.endsAt;

    if (!Number.isInteger(percentage) || percentage < 1 || percentage > 90) {
      throw new ApiError(400, "Discount percentage must be between 1 and 90");
    }

    validateDiscountDates(startsAt, endsAt);

    if (endsAt && endsAt <= new Date()) {
      throw new ApiError(400, "The discount end date must be in the future");
    }

    if (existing.status === "ACTIVE" && product.oldPrice !== null) {
      await restoreDiscountPrices(tx, existing);
    }

    await tx.productDiscount.update({
      where: { productId },
      data: {
        percentage,
        startsAt,
        endsAt,
        status: "ACTIVE",
      },
    });

    const updated = await tx.productDiscount.findUniqueOrThrow({
      where: { productId },
      include: discountInclude,
    });

    if (startsAt <= new Date()) {
      await applyDiscountPrices(tx, updated);
    }

    return tx.productDiscount.findUniqueOrThrow({
      where: { productId },
      include: discountInclude,
    });
  });
}

export async function endProductDiscount(productId: string, storeId: string) {
  await synchronizeProductDiscount(productId);

  return prisma.$transaction(async (tx) => {
    await findDiscountProduct(tx, productId, storeId);

    const discount = await tx.productDiscount.findUnique({
      where: { productId },
      include: discountInclude,
    });

    if (!discount) {
      throw new ApiError(404, "No discount exists for this product");
    }

    if (discount.status === "ACTIVE") {
      await restoreDiscountPrices(tx, discount);
    }

    return tx.productDiscount.findUnique({
      where: { productId },
      include: discountInclude,
    });
  });
}

export async function listStoreProductDiscounts(storeId: string) {
  const discounts = await prisma.productDiscount.findMany({
    where: { storeId },
    select: { productId: true },
  });

  for (const discount of discounts) {
    await synchronizeProductDiscount(discount.productId);
  }

  return prisma.productDiscount.findMany({
    where: { storeId },
    include: discountInclude,
    orderBy: { updatedAt: "desc" },
  });
}
