import { prisma } from "../config/prisma.js";
import {
  Prisma,
  type ProductCondition,
} from "../../generated/prisma/client.js";
import { ApiError } from "../utils/api-error.js";
import { synchronizeProductDiscount } from "./product-discount.service.js";
import type {
  CreateProductInput as ValidatedCreateProductInput,
  UpdateProductInput as ValidatedUpdateProductInput,
} from "../utils/validators/product.validator.js";

const SORT_MAP = {
  newest: { createdAt: "desc" },
  popular: { soldCount: "desc" },
  rating: { ratingStars: "desc" },
  low: { price: "asc" },
  high: { price: "desc" },
  sold: { soldCount: "desc" },
} as const;

const CONDITION_MAP: Record<string, ProductCondition> = {
  BRAND_NEW: "BRAND_NEW",
  LIKE_NEW: "LIKE_NEW",
  GOOD: "GOOD",
  FAIR: "FAIR",
  USED: "USED",

  // Accept existing catalogue filter labels as well.
  "Brand new": "BRAND_NEW",
  "Like new": "LIKE_NEW",
  Good: "GOOD",
  Fair: "FAIR",
  Used: "USED",
};

type GetProductsParams = {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  category?: string | undefined;
  sort?: keyof typeof SORT_MAP | undefined;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  condition?: string[] | undefined;
  location?: string[] | undefined;
  minRating?: number | undefined;
  verifiedOnly?: boolean | undefined;
};

type ProductVariantInput = {
  combination: Record<string, string>;
  price: number;
  stock: number;
  sku: string;
};

type CreateProductInput = ValidatedCreateProductInput & {
  storeId: string;
};

type UpdateProductInput = ValidatedUpdateProductInput;

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(
  storeId: string,
  name: string,
  productId?: string,
): Promise<string> {
  const baseSlug = createSlug(name) || `product-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        storeId,
        slug,
        ...(productId
          ? {
              NOT: { id: productId },
            }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * JSON fields are validated at the API boundary where applicable.
 * This helper prevents unsupported JavaScript values from being written
 * into Prisma JSON fields.
 */

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  if (value === null) {
    throw new ApiError(
      400,
      "Use Prisma.DbNull when clearing a nullable JSON field",
    );
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new ApiError(400, "JSON values cannot contain non-finite numbers");
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonInput(item));
  }

  if (typeof value === "object") {
    const result: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        result[key] = toJsonInput(item);
      }
    }

    return result;
  }

  throw new ApiError(400, "Invalid JSON data supplied for product metadata");
}

const publicProductSelect = {
  id: true,
  storeId: true,
  categoryId: true,
  type: true,
  name: true,
  slug: true,
  description: true,
  images: true,
  price: true,
  oldPrice: true,
  condition: true,
  status: true,
  stock: true,
  ratingStars: true,
  ratingCount: true,
  soldCount: true,
  keywords: true,
  hasVariants: true,
  variants: true,
  location: true,
  listingMeta: true,
  createdAt: true,
  updatedAt: true,

  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },

  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      handle: true,
      logo: true,
      location: true,
      isVerified: true,
      ratingStars: true,
      ratingCount: true,
    },
  },

  discount: {
    select: {
      percentage: true,
      status: true,
      startsAt: true,
      endsAt: true,
      originalPrice: true,
    },
  },

  productVariants: {
    select: {
      id: true,
      combination: true,
      price: true,
      stock: true,
      sku: true,
      discountPriceSnapshot: {
        select: {
          originalPrice: true,
        },
      },
    },
  },
} as const;

/**
 * Synchronize discounts that have reached a transition point before
 * catalogue filtering, sorting, and pagination.
 */
async function synchronizeDuePublicProductDiscounts(): Promise<void> {
  const now = new Date();

  const [expiredDiscounts, dueScheduledDiscounts] = await Promise.all([
    prisma.productDiscount.findMany({
      where: {
        status: "ACTIVE",
        endsAt: { lte: now },
      },
      select: { productId: true },
    }),

    prisma.productDiscount.findMany({
      where: {
        status: "ACTIVE",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        product: {
          is: { oldPrice: null },
        },
      },
      select: { productId: true },
    }),
  ]);

  const productIds = new Set([
    ...expiredDiscounts.map(({ productId }) => productId),
    ...dueScheduledDiscounts.map(({ productId }) => productId),
  ]);

  for (const productId of productIds) {
    await synchronizeProductDiscount(productId);
  }
}

function serializePublicProduct<
  T extends {
    oldPrice: unknown;
    discount: {
      percentage: number;
      status: string;
      startsAt: Date;
      endsAt: Date | null;
    } | null;
    productVariants: Array<{
      discountPriceSnapshot: { originalPrice: unknown } | null;
    }>;
  },
>(product: T) {
  const now = new Date();

  const discountIsApplied =
    product.oldPrice !== null &&
    product.discount?.status === "ACTIVE" &&
    product.discount.startsAt <= now &&
    (product.discount.endsAt === null || product.discount.endsAt > now);

  return {
    ...product,

    discountPercentage: discountIsApplied ? product.discount!.percentage : null,

    productVariants: product.productVariants.map((variant) => ({
      ...variant,

      oldPrice: discountIsApplied
        ? (variant.discountPriceSnapshot?.originalPrice ?? null)
        : null,

      discountPercentage: discountIsApplied
        ? product.discount!.percentage
        : null,
    })),
  };
}

function mapCondition(condition: string): ProductCondition | undefined {
  return CONDITION_MAP[condition];
}

function normalizeVariants(
  variants: ProductVariantInput[],
): ProductVariantInput[] {
  return variants.map((variant) => ({
    combination: variant.combination,
    price: variant.price,
    stock: variant.stock,
    sku: variant.sku.trim(),
  }));
}

// -----------------------------------------------------------------------------
// Create product
// -----------------------------------------------------------------------------

export async function createProduct(input: CreateProductInput) {
  const store = await prisma.store.findUnique({
    where: { id: input.storeId },
    select: {
      id: true,
      ownerId: true,
      status: true,
    },
  });

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  if (store.status !== "ACTIVE") {
    throw new ApiError(400, "Products can only be created for an active store");
  }

  if (input.condition && !mapCondition(input.condition)) {
    throw new ApiError(400, "Invalid product condition");
  }

  if (
    input.hasVariants === true &&
    input.type !== undefined &&
    input.type !== "REGULAR"
  ) {
    throw new ApiError(
      400,
      "Variants are currently supported for regular products only",
    );
  }

  if (
    input.type !== undefined &&
    input.type !== "REGULAR" &&
    input.type !== "CAR" &&
    input.type !== "REALESTATE"
  ) {
    throw new ApiError(400, "Invalid product type");
  }

  const slug = await generateUniqueSlug(input.storeId, input.name);

  const productData: Prisma.ProductUncheckedCreateInput = {
    storeId: input.storeId,
    type: input.type ?? "REGULAR",
    name: input.name,
    slug,
    description: input.description,
    images: input.images,
    price: input.price,
    condition: mapCondition(input.condition ?? "BRAND_NEW") ?? "BRAND_NEW",
    status: input.status ?? "DRAFT",
    hasVariants: input.hasVariants ?? false,
  };

  if (input.categoryId !== undefined) {
    productData.categoryId = input.categoryId;
  }

  if (input.costPrice !== undefined) {
    productData.costPrice = input.costPrice;
  }

  if (input.stock !== undefined) {
    productData.stock = input.stock;
  }

  if (input.keywords !== undefined) {
    productData.keywords =
      input.keywords === null ? Prisma.DbNull : toJsonInput(input.keywords);
  }

  if (input.variants !== undefined) {
    productData.variants =
      input.variants === null ? Prisma.DbNull : toJsonInput(input.variants);
  }

  if (input.location !== undefined) {
    productData.location = input.location;
  }

  if (input.listingMeta !== undefined) {
    productData.listingMeta =
      input.listingMeta === null
        ? Prisma.DbNull
        : toJsonInput(input.listingMeta);
  }

  if (input.hasVariants && input.productVariants?.length) {
    productData.productVariants = {
      create: normalizeVariants(input.productVariants).map((variant) => ({
        combination: toJsonInput(variant.combination),
        price: variant.price,
        stock: variant.stock,
        sku: variant.sku,
      })),
    };
  }

  const product = await prisma.product.create({
    data: productData,
    select: publicProductSelect,
  });

  return serializePublicProduct(product);
}

// -----------------------------------------------------------------------------
// Get public products
// -----------------------------------------------------------------------------

export async function getProducts(params: GetProductsParams) {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(Math.max(1, Math.floor(params.limit ?? 20)), 50);
  const skip = (page - 1) * limit;

  await synchronizeDuePublicProductDiscounts();

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    store: {
      is: { status: "ACTIVE" },
    },
  };

  if (params.category) {
    where.category = {
      is: {
        OR: [
          { id: params.category },
          { slug: params.category },
          { name: params.category },
        ],
      },
    };
  }

  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    where.price = {
      ...(params.priceMin !== undefined ? { gte: params.priceMin } : {}),
      ...(params.priceMax !== undefined ? { lte: params.priceMax } : {}),
    };
  }

  if (params.condition?.length) {
    const mappedConditions = params.condition
      .map(mapCondition)
      .filter(
        (condition): condition is ProductCondition => condition !== undefined,
      );

    if (mappedConditions.length) {
      where.condition = { in: [...new Set(mappedConditions)] };
    }
  }

  const andFilters: Prisma.ProductWhereInput[] = [];

  if (params.location?.length) {
    andFilters.push({
      OR: [
        { location: { in: params.location } },
        {
          store: {
            is: {
              status: "ACTIVE",
              location: { in: params.location },
            },
          },
        },
      ],
    });
  }

  if (params.minRating !== undefined) {
    where.ratingStars = { gte: params.minRating };
  }

  if (params.verifiedOnly) {
    where.store = {
      is: {
        status: "ACTIVE",
        isVerified: true,
      },
    };
  }

  if (params.search?.trim()) {
    const search = params.search.trim();

    andFilters.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (andFilters.length) {
    where.AND = andFilters;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    SORT_MAP[params.sort ?? "newest"] ?? SORT_MAP.newest;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: publicProductSelect,
    }),

    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    products: products.map(serializePublicProduct),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
}

// -----------------------------------------------------------------------------
// Get one public product
// -----------------------------------------------------------------------------

export async function getPublicProduct(identifier: string) {
  await synchronizeDuePublicProductDiscounts();

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
      status: "ACTIVE",
      store: {
        is: { status: "ACTIVE" },
      },
    },
    select: publicProductSelect,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return serializePublicProduct(product);
}

// -----------------------------------------------------------------------------
// Find a product belonging to a specific store
// -----------------------------------------------------------------------------

async function findSellerProduct(productId: string, storeId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId,
    },
    include: {
      discount: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found in your store");
  }

  return product;
}

// -----------------------------------------------------------------------------
// Update seller product
// -----------------------------------------------------------------------------

export async function updateProduct(
  productId: string,
  storeId: string,
  input: UpdateProductInput,
) {
  const existing = await findSellerProduct(productId, storeId);

  const hasActiveDiscount = existing.discount?.status === "ACTIVE";

  if (
    hasActiveDiscount &&
    (input.price !== undefined ||
      input.productVariants !== undefined ||
      input.hasVariants !== undefined)
  ) {
    throw new ApiError(
      409,
      "End the product discount before changing its price or variants",
      "PRODUCT_DISCOUNT_ACTIVE",
    );
  }

  if (input.condition && !mapCondition(input.condition)) {
    throw new ApiError(400, "Invalid product condition");
  }

  const nextType = input.type ?? existing.type;
  const nextHasVariants = input.hasVariants ?? existing.hasVariants;

  if (nextHasVariants && nextType !== "REGULAR") {
    throw new ApiError(
      400,
      "Variants are currently supported for regular products only",
    );
  }

  let slug = existing.slug;

  if (input.name && input.name !== existing.name) {
    slug = await generateUniqueSlug(storeId, input.name, productId);
  }

  const updateData: Prisma.ProductUncheckedUpdateInput = {};

  if (input.categoryId !== undefined) {
    updateData.categoryId = input.categoryId;
  }

  if (input.type !== undefined) {
    updateData.type = input.type;
  }

  if (input.name !== undefined) {
    updateData.name = input.name;
    updateData.slug = slug;
  }

  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  if (input.images !== undefined) {
    updateData.images = input.images;
  }

  if (input.price !== undefined) {
    updateData.price = input.price;
  }

  if (input.costPrice !== undefined) {
    updateData.costPrice = input.costPrice;
  }

  if (input.condition !== undefined) {
    updateData.condition = mapCondition(input.condition)!;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  if (input.stock !== undefined) {
    updateData.stock = input.stock;
  }

  if (input.keywords !== undefined) {
    updateData.keywords =
      input.keywords === null ? Prisma.DbNull : toJsonInput(input.keywords);
  }

  if (input.hasVariants !== undefined) {
    updateData.hasVariants = input.hasVariants;
  }

  if (input.variants !== undefined) {
    updateData.variants =
      input.variants === null ? Prisma.DbNull : toJsonInput(input.variants);
  }

  if (input.location !== undefined) {
    updateData.location = input.location;
  }

  if (input.listingMeta !== undefined) {
    updateData.listingMeta =
      input.listingMeta === null
        ? Prisma.DbNull
        : toJsonInput(input.listingMeta);
  }

  if (input.productVariants !== undefined) {
    if (nextHasVariants) {
      updateData.productVariants = {
        deleteMany: {},
        create: normalizeVariants(input.productVariants).map((variant) => ({
          combination: toJsonInput(variant.combination),
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku,
        })),
      };
    } else {
      updateData.productVariants = {
        deleteMany: {},
      };
    }
  } else if (input.hasVariants === false) {
    updateData.productVariants = {
      deleteMany: {},
    };
  }

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: updateData,
    select: publicProductSelect,
  });

  return serializePublicProduct(product);
}

// -----------------------------------------------------------------------------
// Archive seller product instead of permanently deleting it
// -----------------------------------------------------------------------------

export async function archiveProduct(productId: string, storeId: string) {
  await findSellerProduct(productId, storeId);

  const product = await prisma.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED" },
    select: publicProductSelect,
  });

  return serializePublicProduct(product);
}
