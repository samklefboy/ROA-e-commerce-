import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

import { respondToDisputeController } from "../controllers/dispute-response.controller.js";
import {
  getAdminDisputeController,
  getAdminDisputesController,
  getDisputeController,
  getMyDisputesController,
  getSellerDisputesController,
} from "../controllers/dispute-query.controller.js";
import { reviewDisputeController } from "../controllers/admin/admin-dispute-review.controller.js";
import { resolveDisputeController } from "../controllers/admin/dispute-resolution.controller.js";

const router = Router();

router.use(authMiddleware);

// Buyer and seller views
router.get("/my", getMyDisputesController);
router.get("/seller", getSellerDisputesController);

// Admin routes must come before the generic /:id route.
router.get("/admin", adminMiddleware, getAdminDisputesController);
router.get("/admin/:id", adminMiddleware, getAdminDisputeController);
router.patch("/admin/:id/review", adminMiddleware, reviewDisputeController);
router.patch("/admin/:id/resolve", adminMiddleware, resolveDisputeController);

// Seller response and participant detail
router.patch("/:id/response", respondToDisputeController);
router.get("/:id", getDisputeController);

export default router;
