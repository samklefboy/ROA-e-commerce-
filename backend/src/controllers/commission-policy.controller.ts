import type { RequestHandler } from "express";
import { getSellerCommissionRate } from "../services/commission-policy.service.js";

export const getCommissionRate: RequestHandler = async (req, res, next) => {
  try {
    const result = await getSellerCommissionRate(req.authUser.id);

    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
