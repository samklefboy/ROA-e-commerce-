import { Router } from "express";

import {
  followStoreController,
  getFollowedStoresController,
  getStoreFollowStatusController,
  unfollowStoreController,
} from "../controllers/store-follow.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Must be authenticated: returns only the signed-in user's followed stores.
router.get("/following", authMiddleware, getFollowedStoresController);

// Existing store-specific follow routes.
router.post("/:storeId/follow", authMiddleware, followStoreController);
router.delete("/:storeId/follow", authMiddleware, unfollowStoreController);
router.get(
  "/:storeId/follow/status",
  authMiddleware,
  getStoreFollowStatusController,
);

export default router;
