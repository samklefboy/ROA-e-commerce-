import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { synchronizeProductDiscount } from "./product-discount.service.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

const SORT_OPTIONS = [
  "newest",
  "best-selling",
  "price-low-high",
  "price-high-low",
  "highest-rated",
] as const;

const PRODUCT_CONDITIONS = [
  "BRAND_NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
  "USED",
] as const;

const PRODUCT_TYPES = ["REGULAR", "REALESTATE", "CAR"] as const;

export type StoreCatalogueSort = (typeof SORT_OPTIONS)[number];
export type StoreCatalogueCondition = (typeof PRODUCT_CONDITIONS)[number];
export type StoreCatalogueProductType = (typeof PRODUCT_TYPES)[number];

export type StoreCatalogueQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: StoreCatalogueSort;
  priceMin?: number;
  priceMax?: number;
  condition?: StoreCatalogueCondition[];
  minRating?: number;
  type?: StoreCatalogueProductType;
  inStockOnly?: boolean;
};

function normalizePagination(query: StoreCatalogueQuery) {
  const page = query.page ?? 1;
  const requestedLimit = query.limit ?? DEFAULT_LIMIT;

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }

  if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
    throw new ApiError(400, "Limit must be a positive integer");
  }

  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  if (!Number.isSafeInteger(skip)) {
    throw new ApiError(400, "Requested page is too large");
  }

  return { page, limit, skip };
}

function buildProductOrderBy(
  sort: StoreCatalogueSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "best-selling":
      return [{ soldCount: "desc" }, { createdAt: "desc" }, { id: "asc" }];

    case "price-low-high":
      return [{ price: "asc" }, { createdAt: "desc" }, { id: "asc" }];

    case "price-high-low":
      return [{ price: "desc" }, { createdAt: "desc" }, { id: "asc" }];

    case "highest-rated":
      return [
        { ratingStars: "desc" },
        { ratingCount: "desc" },
        { createdAt: "desc" },
        { id: "asc" },
      ];

    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

/**
 * Synchronize only this store's discounts that need a schedule transition.
 * This runs before price filtering, sorting, and pagination so the catalogue
 * is queried using the current effective product prices.
 */
async function synchronizeDueStoreDiscounts(storeId: string) {
  const now = new Date();

  const [expiredDiscounts, dueScheduledDiscounts] = await Promise.all([
    prisma.productDiscount.findMany({
      where: {
        storeId,
        status: "ACTIVE",
        endsAt: { lte: now },
      },
      select: { productId: true },
    }),
    prisma.productDiscount.findMany({
      where: {
        storeId,
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

  // Keep the number of open transactions bounded if many discounts transition
  // at the same time. Each synchronization is idempotent for the same state.
  const ids = [...productIds];
  const batchSize = 20;

  for (let index = 0; index < ids.length; index += batchSize) {
    await Promise.all(
      ids
        .slice(index, index + batchSize)
        .map((productId) => synchronizeProductDiscount(productId)),
    );
  }
}

const publicCatalogueProductSelect = {
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
  ratingStars: true,
  ratingCount: true,
  soldCount: true,
  hasVariants: true,
  variants: true,
  location: true,
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
      isOpen: true,
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
    },
  },

  productVariants: {
    select: {
      id: true,
      combination: true,
      price: true,
      discountPriceSnapshot: {
        select: {
          originalPrice: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

function serializeCatalogueProduct<
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

export async function fetchStoreCatalogue(
  slug: string,
  query: StoreCatalogueQuery = {},
) {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    throw new ApiError(400, "Store slug is required");
  }

  const { page, limit, skip } = normalizePagination(query);
  const search = query.search?.trim();

  if (search && search.length > MAX_SEARCH_LENGTH) {
    throw new ApiError(
      400,
      `Search must not exceed ${MAX_SEARCH_LENGTH} characters`,
    );
  }

  if (
    query.priceMin !== undefined &&
    (!Number.isFinite(query.priceMin) || query.priceMin < 0)
  ) {
    throw new ApiError(400, "Minimum price must be non-negative");
  }

  if (
    query.priceMax !== undefined &&
    (!Number.isFinite(query.priceMax) || query.priceMax < 0)
  ) {
    throw new ApiError(400, "Maximum price must be non-negative");
  }

  if (
    query.priceMin !== undefined &&
    query.priceMax !== undefined &&
    query.priceMin > query.priceMax
  ) {
    throw new ApiError(400, "Minimum price cannot exceed maximum price");
  }

  if (
    query.minRating !== undefined &&
    (!Number.isFinite(query.minRating) ||
      query.minRating < 0 ||
      query.minRating > 5)
  ) {
    throw new ApiError(400, "Minimum rating must be between 0 and 5");
  }

  const sort = query.sort ?? "newest";

  if (!(SORT_OPTIONS as readonly string[]).includes(sort)) {
    throw new ApiError(400, "Unsupported catalogue sort option");
  }

  const store = await prisma.store.findUnique({
    where: { slug: normalizedSlug },
    select: {
      id: true,
      slug: true,
      status: true,
    },
  });

  if (!store || store.status !== "ACTIVE") {
    throw new ApiError(404, "Store not found");
  }

  await synchronizeDueStoreDiscounts(store.id);

  const conditions: Prisma.ProductWhereInput[] = [
    { storeId: store.id },
    { status: "ACTIVE" },
    {
      store: {
        is: { status: "ACTIVE" },
      },
    },
  ];

  if (search) {
    conditions.push({
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.category?.trim()) {
    const category = query.category.trim();

    conditions.push({
      category: {
        is: {
          OR: [
            { id: category },
            { slug: category.toLowerCase() },
            {
              name: {
                equals: category,
                mode: "insensitive",
              },
            },
          ],
        },
      },
    });
  }

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    conditions.push({
      price: {
        ...(query.priceMin !== undefined ? { gte: query.priceMin } : {}),
        ...(query.priceMax !== undefined ? { lte: query.priceMax } : {}),
      },
    });
  }

  if (query.condition?.length) {
    conditions.push({
      condition: {
        in: [...new Set(query.condition)],
      },
    });
  }

  if (query.minRating !== undefined) {
    conditions.push({
      ratingStars: { gte: query.minRating },
    });
  }

  if (query.type) {
    conditions.push({ type: query.type });
  }

  if (query.inStockOnly) {
    conditions.push({
      OR: [
        { stock: { gt: 0 } },
        {
          hasVariants: true,
          productVariants: {
            some: { stock: { gt: 0 } },
          },
        },
      ],
    });
  }

  const where: Prisma.ProductWhereInput = {
    AND: conditions,
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildProductOrderBy(sort),
      select: publicCatalogueProductSelect,
    }),

    prisma.product.count({ where }),

    prisma.category.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            storeId: store.id,
            status: "ACTIVE",
            store: {
              is: { status: "ACTIVE" },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    store: {
      id: store.id,
      slug: store.slug,
    },
    products: products.map(serializeCatalogueProduct),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      hasPreviousPage: page > 1,
    },
    filters: {
      categories,
      sortOptions: [
        { value: "newest", label: "Newest arrivals" },
        { value: "best-selling", label: "Best-selling" },
        { value: "price-low-high", label: "Price: low to high" },
        { value: "price-high-low", label: "Price: high to low" },
        { value: "highest-rated", label: "Highest rated" },
      ],
      conditions: PRODUCT_CONDITIONS,
      productTypes: PRODUCT_TYPES,
    },
  };
}
