import { Router } from "express";
import { getCommissionRate } from "../controllers/commission-policy.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/rate", authMiddleware, getCommissionRate);

export default router;
