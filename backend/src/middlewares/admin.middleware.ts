import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

export const adminMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const authUser = (
      req as typeof req & {
        authUser?: { id: string; phone: string };
      }
    ).authUser;

    if (!authUser) {
      throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new ApiError(
        401,
        "Authenticated user no longer exists",
        "AUTH_USER_NOT_FOUND",
      );
    }

    if (user.role !== "ADMIN") {
      throw new ApiError(
        403,
        "Administrator access required",
        "ADMIN_ACCESS_REQUIRED",
      );
    }

    if (!user.isVerified) {
      throw new ApiError(
        403,
        "A verified account is required for administrator access",
        "ADMIN_ACCOUNT_NOT_VERIFIED",
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
