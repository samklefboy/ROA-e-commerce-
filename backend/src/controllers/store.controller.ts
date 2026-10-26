import type { RequestHandler } from "express";
import * as storeService from "../services/store.service.js";
import { z } from "zod";
import { fetchStoreCatalogue } from "../services/store-catalogue.service.js";
import { successResponse } from "../utils/response.js";

export const createStore: RequestHandler = async (req, res, next) => {
  try {
    const store = await storeService.createStore(req.authUser.id, req.body);
    return successResponse(res, 201, {
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    next(error);
  }
};

export const getStore: RequestHandler<{ slug: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const store = await storeService.getStoreBySlug(req.params.slug);

    return successResponse(res, 200, { store });
  } catch (error) {
    next(error);
  }
};

export const getMyStore: RequestHandler = async (req, res, next) => {
  try {
    const store = await storeService.getMyStore(req.authUser.id);
    return successResponse(res, 200, { store });
  } catch (error) {
    next(error);
  }
};

export const updateStore: RequestHandler = async (req, res, next) => {
  try {
    const store = await storeService.updateStore(req.authUser.id, req.body);
    return successResponse(res, 200, {
      message: "Store updated successfully",
      store,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPayoutAccount: RequestHandler = async (req, res, next) => {
  try {
    const payout = await storeService.getMyPayoutAccount(req.authUser.id);

    return successResponse(res, 200, {
      message: "Payout account retrieved successfully",
      ...payout,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyPayoutAccount: RequestHandler = async (req, res, next) => {
  try {
    const payout = await storeService.updateMyPayoutAccount(
      req.authUser.id,
      req.body,
    );

    return successResponse(res, 200, {
      message: "Payout account updated successfully",
      ...payout,
    });
  } catch (error) {
    next(error);
  }
};

const storeCatalogueQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().positive().optional(),

  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional(),

  category: z.string().trim().min(1).max(100).optional(),

  sort: z
    .enum([
      "newest",
      "best-selling",
      "price-low-high",
      "price-high-low",
      "highest-rated",
    ])
    .optional(),

  priceMin: z.coerce.number().nonnegative().optional(),

  priceMax: z.coerce.number().nonnegative().optional(),

  condition: z.preprocess(
    (value) => {
      if (value === undefined) return undefined;

      const values = Array.isArray(value) ? value : [value];

      return values.flatMap((item) =>
        typeof item === "string" ? item.split(",") : [item],
      );
    },
    z
      .array(z.enum(["BRAND_NEW", "LIKE_NEW", "GOOD", "FAIR", "USED"]))
      .optional(),
  ),

  minRating: z.coerce.number().min(0).max(5).optional(),

  type: z.enum(["REGULAR", "REALESTATE", "CAR"]).optional(),

  inStockOnly: z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean().optional()),
});

export const getStoreCatalogue: RequestHandler<{ slug: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const parsedQuery = storeCatalogueQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid store catalogue query parameters",
        errors: parsedQuery.error.flatten(),
      });
    }

    const { priceMin, priceMax, ...parsedCatalogueQuery } = parsedQuery.data;

    if (
      priceMin !== undefined &&
      priceMax !== undefined &&
      priceMin > priceMax
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot exceed maximum price",
      });
    }

    // Remove undefined properties to comply with
    // exactOptionalPropertyTypes: true.
    const catalogueQuery = Object.fromEntries(
      Object.entries({
        ...parsedCatalogueQuery,
        priceMin,
        priceMax,
      }).filter(([, value]) => value !== undefined),
    ) as import("../services/store-catalogue.service.js").StoreCatalogueQuery;

    const catalogue = await fetchStoreCatalogue(
      req.params.slug,
      catalogueQuery,
    );

    return successResponse(res, 200, { catalogue });
  } catch (error) {
    next(error);
  }
};
