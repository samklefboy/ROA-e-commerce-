import { Router } from "express";

import { deliveryQuote, preview } from "../controllers/checkout.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/delivery-quote", deliveryQuote);

router.post("/preview", preview);

export default router;
