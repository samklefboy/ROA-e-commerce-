import type { RequestHandler } from "express";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { successResponse } from "../utils/response.js";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).nullable().optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase())
      .nullable()
      .optional(),
    avatar: z.string().trim().min(1).max(2048).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one profile field to update",
  });

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

const profileSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  phone: true,
  isVerified: true,
  hasStore: true,
  createdAt: true,
  updatedAt: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      tagline: true,
      status: true,
      isVerified: true,
    },
  },
} as const;

function serializeProfile<
  T extends {
    store: {
      status: string;
    } | null;
  },
>(user: T) {
  return {
    ...user,
    hasStore: user.store !== null,
    sellerDashboardAccess: user.store !== null,
    canSell: user.store?.status === "ACTIVE",
  };
}

export const getRoa: RequestHandler = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.authUser!.id },
      select: profileSelect,
    });

    if (!user) {
      throw new ApiError(404, "User account not found", "USER_NOT_FOUND");
    }

    return successResponse(res, 200, {
      message: "Profile retrieved successfully",
      user: serializeProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoaProfile: RequestHandler = async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid profile data",
        "INVALID_PROFILE_DATA",
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: req.authUser!.id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new ApiError(404, "User account not found", "USER_NOT_FOUND");
    }

    const data: {
      name?: string | null;
      email?: string | null;
      avatar?: string | null;
    } = {};

    if (parsed.data.name !== undefined) {
      data.name = parsed.data.name;
    }

    if (parsed.data.email !== undefined) {
      data.email = parsed.data.email;
    }

    if (parsed.data.avatar !== undefined) {
      data.avatar = parsed.data.avatar;
    }

    const user = await prisma.user.update({
      where: { id: req.authUser!.id },
      data,
      select: profileSelect,
    });

    return successResponse(res, 200, {
      message: "Profile updated successfully",
      user: serializeProfile(user),
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      next(
        new ApiError(
          409,
          "That email address is already associated with another account",
          "EMAIL_ALREADY_EXISTS",
        ),
      );
      return;
    }

    next(error);
  }
};
