import { Router } from "express";

import {
  addToCartController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "../controllers/cart.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getCartController);

router.post("/", addToCartController);

router.patch("/:id", updateCartItemController);

router.delete("/:id", removeCartItemController);

router.delete("/", clearCartController);

export default router;
