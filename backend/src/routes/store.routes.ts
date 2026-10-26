import { Router } from "express";
import {
  createStore,
  getMyStore,
  getStore,
  updateStore,
} from "../controllers/store.controller.js";
import {
  createStoreSchema,
  payoutAccountSchema,
  updateStoreSchema,
  createPromotionSchema,
  updatePromotionSchema,
} from "../utils/store.validation.js";
import * as storeController from "../controllers/store.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import * as storePromotionController from "../controllers/store-promotion.controller.js";

const router = Router();

router.post("/", authMiddleware, validateBody(createStoreSchema), createStore);

router.get("/me", authMiddleware, getMyStore);

router.patch(
  "/me",
  authMiddleware,
  validateBody(updateStoreSchema),
  updateStore,
);

router.get("/me/payout", authMiddleware, storeController.getMyPayoutAccount);

router.patch(
  "/me/payout",
  authMiddleware,
  validateBody(payoutAccountSchema),
  storeController.updateMyPayoutAccount,
);

// Public buyer catalogue: /store/:slug/products
router.get("/:slug/products", storeController.getStoreCatalogue);
router.get("/:slug", getStore);

//Seller-managed store promotions.
router.get(
  "/me/promotions",
  authMiddleware,
  storePromotionController.listMyPromotions,
);

router.post(
  "/me/promotions",
  authMiddleware,
  validateBody(createPromotionSchema),
  storePromotionController.createPromotion,
);

router.patch(
  "/me/promotions/:promotionId",
  authMiddleware,
  validateBody(updatePromotionSchema),
  storePromotionController.updatePromotion,
);

router.patch(
  "/me/promotions/:promotionId/publish",
  authMiddleware,
  storePromotionController.publishPromotion,
);

router.patch(
  "/me/promotions/:promotionId/archive",
  authMiddleware,
  storePromotionController.archivePromotion,
);

// Public store-front promotions.
router.get("/:slug/promotions", storePromotionController.getPublicPromotions);

export default router;
