import type { Request, Response, NextFunction } from "express";
import { getWalletBalance } from "../services/wallet/wallet-balance.service.js";
import { successResponse } from "../utils/response.js";
import {
  getWalletSummary,
  getWalletTransactions,
} from "../services/wallet/wallet-query.service.js";
import {
  walletSummaryQuerySchema,
  walletTransactionsQuerySchema,
} from "../utils/validators/wallet-query.validations.js";

export async function getMyWallet(req: Request, res: Response) {
  const wallet = await getWalletBalance(req.authUser.id);

  return successResponse(res, 200, {
    message: "Wallet retrieved successfully",
    wallet,
  });
}

export async function getMyWalletSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = walletSummaryQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet summary filters.",
        errors: parsed.error.flatten(),
      });
    }

    const summary = await getWalletSummary(req.authUser.id, parsed.data);

    return successResponse(res, 200, summary);
  } catch (error) {
    return next(error);
  }
}

export async function getMyWalletTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = walletTransactionsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction filters.",
        errors: parsed.error.flatten(),
      });
    }

    const result = await getWalletTransactions(req.authUser.id, parsed.data);

    return successResponse(res, 200, result);
  } catch (error) {
    return next(error);
  }
}
