import { Router } from "express";
import {
  createStoreReviewController,
  listStoreReviewsController,
} from "../controllers/store-review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:storeId/reviews", listStoreReviewsController);
router.post("/:storeId/reviews", authMiddleware, createStoreReviewController);

export default router;
