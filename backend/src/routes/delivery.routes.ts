import { Router } from "express";

import {
  calculateDeliveryQuoteController,
  createDeliveryRuleController,
  deleteDeliveryRuleController,
  getDeliveryRulesController,
  updateDeliveryRuleController,
  updatePickupSettingsController,
} from "../controllers/delivery.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/quote", authMiddleware, calculateDeliveryQuoteController);

router.get(
  "/stores/:storeId/rules",
  authMiddleware,
  getDeliveryRulesController,
);

router.post("/rules", authMiddleware, createDeliveryRuleController);

router.patch("/rules/:id", authMiddleware, updateDeliveryRuleController);

router.delete("/rules/:id", authMiddleware, deleteDeliveryRuleController);

/*
 * Seller pickup configuration
 */
router.patch("/pickup", authMiddleware, updatePickupSettingsController);

export default router;
