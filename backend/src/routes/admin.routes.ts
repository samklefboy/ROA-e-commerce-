import { Router } from "express";
import { z } from "zod";

import {
  getAdminStoreReportController,
  listAdminStoreReportsController,
  reviewAdminStoreReportController,
} from "../controllers/admin/admin-store-report.controller.js";
import { listDeliveryEvidenceController } from "../controllers/admin/admin-delivery-evidence.controller.js";
import { reviewDeliveryEvidenceController } from "../controllers/admin/delivery-evidence-review.controller.js";
import {
  getAdminStoreController,
  listAdminStoresController,
  reinstateStoreController,
  suspendStoreController,
} from "../controllers/admin/admin-store.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

const reviewStoreReportSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  adminNotes: z.string().trim().max(5000).nullable().optional(),
});

// Delivery evidence
router.get("/delivery-evidence", listDeliveryEvidenceController);
router.patch("/delivery-evidence/:id/review", reviewDeliveryEvidenceController);

// Store management
router.get("/stores", listAdminStoresController);
router.get("/stores/:id", getAdminStoreController);
router.patch("/stores/:id/suspend", suspendStoreController);
router.patch("/stores/:id/reinstate", reinstateStoreController);

// Store reports
router.get("/store-reports", listAdminStoreReportsController);
router.get("/store-reports/:id", getAdminStoreReportController);
router.patch(
  "/store-reports/:id/review",
  validateBody(reviewStoreReportSchema),
  reviewAdminStoreReportController,
);

export default router;
