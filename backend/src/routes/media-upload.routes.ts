import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createMediaUploadController,
  verifyMediaUploadController,
} from "../controllers/media-upload.controller.js";

const router = Router();

router.post("/uploads/sign", authMiddleware, createMediaUploadController);
router.post("/uploads/verify", authMiddleware, verifyMediaUploadController);

export default router;
