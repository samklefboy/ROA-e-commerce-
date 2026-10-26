import type { RequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";
import { verifyToken } from "../utils/jwt.js";

export const authMiddleware: RequestHandler = (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Use a Bearer token", "INVALID_AUTH_HEADER");
    }

    const payload = verifyToken(token);
    if (
      payload.type !== "access" ||
      typeof payload.sub !== "string" ||
      typeof payload.phone !== "string"
    ) {
      throw new ApiError(401, "Invalid authentication token", "INVALID_TOKEN");
    }

    req.authUser = {
      id: payload.sub,
      phone: payload.phone,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(
      new ApiError(
        401,
        "Invalid or expired authentication token",
        "INVALID_TOKEN",
      ),
    );
  }
};
