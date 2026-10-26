import { Router } from "express";
import { z } from "zod";

import {
  createStoreReportController,
  listMyStoreReportsController,
} from "../controllers/store-report.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";

const router = Router();

const createStoreReportSchema = z.object({
  orderId: z.string().trim().min(1).optional().nullable(),
  reason: z.enum([
    "FRAUD",
    "MISLEADING_LISTING",
    "COUNTERFEIT_PRODUCT",
    "SELLER_MISCONDUCT",
    "REPEATED_CANCELLATIONS",
    "DELIVERY_PROBLEM",
    "POOR_PRODUCT_QUALITY",
    "OTHER",
  ]),
  description: z.string().trim().min(10).max(5000),
});

router.use(authMiddleware);

// Keep this route before any overlapping dynamic store routes.
router.get("/mine", listMyStoreReportsController);

router.post(
  "/:storeId",
  validateBody(createStoreReportSchema),
  createStoreReportController,
);

export default router;
