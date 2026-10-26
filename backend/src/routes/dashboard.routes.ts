import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getStoreDashboardOverviewController } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/store/overview", getStoreDashboardOverviewController);

export default router;
