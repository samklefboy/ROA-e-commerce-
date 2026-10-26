import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../utils/api-error.js";
import {
  createMediaUpload,
  verifyMediaUpload,
  MEDIA_PURPOSES,
} from "../services/media-upload.service.js";

const createMediaUploadSchema = z.object({
  purpose: z.enum(MEDIA_PURPOSES),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
});

const verifyMediaUploadSchema = z.object({
  purpose: z.enum(MEDIA_PURPOSES),
  key: z.string().min(1).max(1024),
});

export async function verifyMediaUploadController(req: Request, res: Response) {
  if (!req.authUser?.id) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const input = verifyMediaUploadSchema.parse(req.body);

  const result = await verifyMediaUpload({
    userId: req.authUser.id,
    ...input,
  });

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    message: "Image upload verified successfully",
    data: result,
  });
}

export async function createMediaUploadController(req: Request, res: Response) {
  if (!req.authUser?.id) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const input = createMediaUploadSchema.parse(req.body);

  const upload = await createMediaUpload({
    userId: req.authUser.id,
    ...input,
  });

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    message: "Image upload authorization created successfully",
    data: upload,
  });
}
