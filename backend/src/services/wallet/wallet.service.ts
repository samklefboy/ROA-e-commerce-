import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export type WalletDbClient = typeof prisma | Prisma.TransactionClient;

export async function createWalletForUser(userId: string) {
  return prisma.wallet.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      ownerType: "USER",
      currency: "NGN",
    },
    update: {},
  });
}

export async function getUserWallet(userId: string) {
  return prisma.wallet.findUnique({
    where: {
      userId,
    },
  });
}

export async function requireUserWallet(
  userId: string,
  db: WalletDbClient = prisma,
) {
  const wallet = await db.wallet.findUnique({
    where: {
      userId,
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  if (!wallet.isActive) {
    throw new ApiError(403, "Wallet is inactive");
  }

  return wallet;
}

export async function requireActiveWalletById(
  walletId: string,
  db: WalletDbClient = prisma,
) {
  const wallet = await db.wallet.findUnique({
    where: {
      id: walletId,
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  if (!wallet.isActive) {
    throw new ApiError(403, "Wallet is inactive");
  }

  return wallet;
}

export async function getWalletForUpdate(
  userId: string,
  db: Prisma.TransactionClient,
) {
  const wallet = await db.wallet.findUnique({
    where: {
      userId,
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  if (!wallet.isActive) {
    throw new ApiError(403, "Wallet is inactive");
  }

  return wallet;
}
