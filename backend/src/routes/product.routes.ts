import { Router } from "express";

import {
  getProductsController,
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController,
  getMyProductsController,
} from "../controllers/product.controller.js";

import {
  createProductDiscountController,
  listProductDiscountsController,
  updateProductDiscountController,
  endProductDiscountController,
} from "../controllers/product-discount.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Public product catalogue.
router.get("/", getProductsController);

// Seller discount management.
router.get("/discounts", authMiddleware, listProductDiscountsController);

// Public product details.
router.get("/:id", getProductController);

// Seller product management.
router.post("/", authMiddleware, createProductController);
router.patch("/:id", authMiddleware, updateProductController);
router.get("/mine", authMiddleware, getMyProductsController);
router.delete("/:id", authMiddleware, deleteProductController);

// Seller product discount management.
router.post("/:id/discount", authMiddleware, createProductDiscountController);

router.patch("/:id/discount", authMiddleware, updateProductDiscountController);

router.delete("/:id/discount", authMiddleware, endProductDiscountController);

export default router;
