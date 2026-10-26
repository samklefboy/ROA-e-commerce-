import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function followStore(storeId: string, userId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, status: true },
  });

  if (!store || store.status !== "ACTIVE") {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.storeFollow.create({
        data: { storeId, userId },
      });

      await tx.store.update({
        where: { id: storeId },
        data: { followerCount: { increment: 1 } },
      });
    });
  } catch (error) {
    // A repeated or concurrent follow must not increment twice.
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  const [follow, followerCount] = await Promise.all([
    prisma.storeFollow.findUnique({
      where: {
        userId_storeId: { userId, storeId },
      },
      select: { followedAt: true },
    }),
    prisma.storeFollow.count({
      where: { storeId },
    }),
  ]);

  return {
    storeId,
    isFollowing: Boolean(follow),
    followerCount,
    followedAt: follow?.followedAt ?? null,
  };
}

export async function unfollowStore(storeId: string, userId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, status: true },
  });

  if (!store || store.status !== "ACTIVE") {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  await prisma.$transaction(async (tx) => {
    const result = await tx.storeFollow.deleteMany({
      where: { storeId, userId },
    });

    if (result.count > 0) {
      await tx.store.update({
        where: { id: storeId },
        data: { followerCount: { decrement: 1 } },
      });
    }
  });

  return {
    storeId,
    isFollowing: false,
    followerCount: await prisma.storeFollow.count({
      where: { storeId },
    }),
  };
}

export async function getStoreFollowStatus(storeId: string, userId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, status: true },
  });

  if (!store || store.status !== "ACTIVE") {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  const [follow, followerCount] = await Promise.all([
    prisma.storeFollow.findUnique({
      where: {
        userId_storeId: { userId, storeId },
      },
      select: { followedAt: true },
    }),
    prisma.storeFollow.count({
      where: { storeId },
    }),
  ]);

  return {
    storeId,
    isFollowing: Boolean(follow),
    followerCount,
    followedAt: follow?.followedAt ?? null,
  };
}

export async function getFollowedStores(
  userId: string,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
) {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  ) {
    throw new ApiError(
      400,
      "Page and limit must be positive integers",
      "INVALID_PAGINATION",
    );
  }

  const safeLimit = Math.min(limit, MAX_LIMIT);
  const skip = (page - 1) * safeLimit;

  if (!Number.isSafeInteger(skip)) {
    throw new ApiError(400, "Invalid pagination values", "INVALID_PAGINATION");
  }

  const [follows, total] = await prisma.$transaction([
    prisma.storeFollow.findMany({
      where: { userId },
      orderBy: [{ followedAt: "desc" }, { storeId: "asc" }],
      skip,
      take: safeLimit,
      select: {
        followedAt: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            tagline: true,
            status: true,
            isOpen: true,
            isVerified: true,
            followerCount: true,
          },
        },
      },
    }),
    prisma.storeFollow.count({
      where: { userId },
    }),
  ]);

  return {
    stores: follows.map(({ followedAt, store }) => ({
      ...store,
      followedAt,
    })),
    pagination: {
      page,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasMore: skip + follows.length < total,
    },
  };
}
