import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  cancelOrderController,
  createOrderController,
  getOrderController,
  getOrdersController,
  confirmSellerOrderController,
  dispatchSellerOrderController,
  confirmBuyerDeliveryController,
} from "../controllers/order.controller.js";
import { submitDeliveryEvidenceController } from "../controllers/delivery-evidence.controller.js";
import { openDisputeController } from "../controllers/dispute.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createOrderController);
router.get("/", getOrdersController);
router.get("/:id", getOrderController);
router.patch("/:id/confirm", confirmSellerOrderController);
router.patch("/:id/cancel", cancelOrderController);
router.patch("/:id/dispatch", dispatchSellerOrderController);
router.patch("/:id/confirm-delivery", confirmBuyerDeliveryController);
router.post("/:id/delivery-evidence", submitDeliveryEvidenceController);
router.post("/:id/disputes", openDisputeController);

export default router;
