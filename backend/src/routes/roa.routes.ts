import { Router } from "express";

import { getRoa, updateRoaProfile } from "../controllers/roa.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", authMiddleware, getRoa);
router.patch("/me", authMiddleware, updateRoaProfile);

export default router;
