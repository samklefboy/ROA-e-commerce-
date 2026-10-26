import { Router } from "express";
import {
  getMyWallet,
  getMyWalletTransactions,
  getMyWalletSummary,
} from "../controllers/wallet.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getMyWallet);
router.get("/summary", authMiddleware, getMyWalletSummary);
router.get("/transactions", authMiddleware, getMyWalletTransactions);

export default router;
