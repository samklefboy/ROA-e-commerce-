import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { submitDeliveryEvidenceController } from "../controllers/delivery-evidence.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:orderId/delivery-evidence", submitDeliveryEvidenceController);

export default router;
