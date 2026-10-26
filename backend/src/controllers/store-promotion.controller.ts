import type { RequestHandler } from "express";
import { z } from "zod";

import * as promotionService from "../services/store-promotion.service.js";
import { successResponse } from "../utils/response.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const listMyPromotions: RequestHandler = async (req, res, next) => {
  try {
    const query = paginationSchema.safeParse(req.query);

    if (!query.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion pagination parameters",
        errors: query.error.flatten(),
      });
    }

    const result = await promotionService.listMyPromotions(
      req.authUser.id,
      query.data.page,
      query.data.limit,
    );

    return successResponse(res, 200, {
      message: "Store promotions retrieved successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const createPromotion: RequestHandler = async (req, res, next) => {
  try {
    const promotion = await promotionService.createStorePromotion(
      req.authUser.id,
      req.body,
    );

    return successResponse(res, 201, {
      message: "Store promotion created successfully",
      promotion,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePromotion: RequestHandler<{ promotionId: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const promotion = await promotionService.updateStorePromotion(
      req.authUser.id,
      req.params.promotionId,
      req.body,
    );

    return successResponse(res, 200, {
      message: "Store promotion updated successfully",
      promotion,
    });
  } catch (error) {
    next(error);
  }
};

export const publishPromotion: RequestHandler<{ promotionId: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const promotion = await promotionService.publishStorePromotion(
      req.authUser.id,
      req.params.promotionId,
    );

    return successResponse(res, 200, {
      message: "Store promotion published successfully",
      promotion,
    });
  } catch (error) {
    next(error);
  }
};

export const archivePromotion: RequestHandler<{ promotionId: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const promotion = await promotionService.archiveStorePromotion(
      req.authUser.id,
      req.params.promotionId,
    );

    return successResponse(res, 200, {
      message: "Store promotion archived successfully",
      promotion,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicPromotions: RequestHandler<{ slug: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const result = await promotionService.getPublicStorePromotions(
      req.params.slug,
    );

    return successResponse(res, 200, {
      message: "Store promotions retrieved successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
