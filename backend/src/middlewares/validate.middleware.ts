import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { ApiError } from "../utils/api-error.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return next(new ApiError(400, message, "VALIDATION_ERROR"));
    }

    req.body = result.data;

    next();
  };
}
