import type { Request, Response } from "express";

import {
  createProduct,
  getProducts,
  getPublicProduct,
  updateProduct,
  archiveProduct,
} from "../services/product.service.js";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../utils/validators/product.validator.js";

export async function getProductsController(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;

  const sort =
    typeof req.query.sort === "string"
      ? (req.query.sort as
          | "newest"
          | "popular"
          | "rating"
          | "low"
          | "high"
          | "sold")
      : undefined;

  const priceMin =
    req.query.priceMin !== undefined ? Number(req.query.priceMin) : undefined;

  const priceMax =
    req.query.priceMax !== undefined ? Number(req.query.priceMax) : undefined;

  const minRating =
    req.query.minRating !== undefined ? Number(req.query.minRating) : undefined;

  const verifiedOnly = req.query.verifiedOnly === "true";

  const condition = parseArrayQuery(req.query.condition);

  const location = parseArrayQuery(req.query.location);

  const result = await getProducts({
    page,
    limit,
    search,
    category,
    sort,
    priceMin,
    priceMax,
    condition,
    location,
    minRating,
    verifiedOnly,
  });

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: result,
  });
}

export async function getProductController(req: Request, res: Response) {
  const identifier = getRouteParam(req.params.identifier, "Product identifier");

  const product = await getPublicProduct(identifier);

  return res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: product,
  });
}

/**
 * POST /api/v1/products
 *
 * Seller creates a product.
 */
export async function createProductController(req: Request, res: Response) {
  if (!req.authUser?.id) {
    throw new ApiError(401, "Authentication required");
  }

  const input = createProductSchema.parse(req.body);

  const store = await prisma.store.findUnique({
    where: {
      ownerId: req.authUser.id,
    },

    select: {
      id: true,
      status: true,
    },
  });

  if (!store) {
    throw new ApiError(403, "You do not have a store");
  }

  if (store.status !== "ACTIVE") {
    throw new ApiError(
      403,
      "Your store must be active before you can create products",
    );
  }

  const product = await createProduct({
    ...input,
    storeId: store.id,
  });

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
}

/**
 * PATCH /api/v1/products/:id
 *
 * Seller updates their own product.
 */
export async function updateProductController(req: Request, res: Response) {
  if (!req.authUser?.id) {
    throw new ApiError(401, "Authentication required");
  }

  const productId = getRouteParam(req.params.id, "Product ID");

  const input = updateProductSchema.parse(req.body);

  const store = await prisma.store.findUnique({
    where: {
      ownerId: req.authUser.id,
    },

    select: {
      id: true,
    },
  });

  if (!store) {
    throw new ApiError(403, "You do not have a store");
  }

  const product = await updateProduct(productId, store.id, input);

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
}

/**
 * DELETE /api/v1/products/:id
 *
 * Seller deletes their own product.
 *
 * Internally this is a soft delete:
 * status → ARCHIVED
 */
export async function deleteProductController(req: Request, res: Response) {
  if (!req.authUser?.id) {
    throw new ApiError(401, "Authentication required");
  }

  const productId = getRouteParam(req.params.id, "Product ID");

  const store = await prisma.store.findUnique({
    where: {
      ownerId: req.authUser.id,
    },

    select: {
      id: true,
    },
  });

  if (!store) {
    throw new ApiError(403, "You do not have a store");
  }

  await archiveProduct(productId, store.id);

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
}

function parseArrayQuery(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return [value.trim()].filter(Boolean);
  }

  return undefined;
}

function getRouteParam(
  value: string | string[] | undefined,
  name: string,
): string {
  if (typeof value !== "string" || !value) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
}

export async function getMyProductsController(req: Request, res: Response) {
  if (!req.authUser?.id) {
    throw new ApiError(401, "Authentication required");
  }

  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  const requestedStatus =
    typeof req.query.status === "string"
      ? req.query.status.toUpperCase()
      : "ALL";

  const allowedStatuses = [
    "ALL",
    "DRAFT",
    "ACTIVE",
    "ARCHIVED",
    "HIDDEN",
  ] as const;

  if (
    !allowedStatuses.includes(
      requestedStatus as (typeof allowedStatuses)[number],
    )
  ) {
    throw new ApiError(400, "Invalid product status");
  }

  const requestedSort =
    typeof req.query.sort === "string" ? req.query.sort : "newest";

  const sortOptions = {
    newest: { createdAt: "desc" as const },
    oldest: { createdAt: "asc" as const },
    name: { name: "asc" as const },
    priceLow: { price: "asc" as const },
    priceHigh: { price: "desc" as const },
    mostSold: { soldCount: "desc" as const },
  };

  if (!Object.prototype.hasOwnProperty.call(sortOptions, requestedSort)) {
    throw new ApiError(400, "Invalid product sort option");
  }

  const store = await prisma.store.findUnique({
    where: { ownerId: req.authUser.id },
    select: { id: true },
  });

  if (!store) {
    throw new ApiError(403, "You do not have a store");
  }

  const where = {
    storeId: store.id,

    ...(requestedStatus !== "ALL"
      ? {
          status: requestedStatus as "DRAFT" | "ACTIVE" | "ARCHIVED" | "HIDDEN",
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sortOptions[requestedSort as keyof typeof sortOptions],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        discount: true,
      },
    }),

    prisma.product.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    message: "Your products were fetched successfully",
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
