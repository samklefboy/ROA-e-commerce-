import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/api-error.js";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(
    new ApiError(
      404,
      `Route ${req.method} ${req.originalUrl} not found`,
      "ROUTE_NOT_FOUND",
    ),
  );
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error(error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.issues.map((issue) => issue.message).join(", "),
      },
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    },
  });
};
