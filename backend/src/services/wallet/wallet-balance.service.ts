import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export async function getWalletBalance(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      availableBalance: true,
      heldBalance: true,
      currency: true,
      isActive: true,
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
