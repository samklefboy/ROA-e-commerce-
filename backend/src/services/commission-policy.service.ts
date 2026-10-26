import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const GLOBAL_POLICY_ID = "global";
const MAX_COMMISSION_BPS = 10_000;

function validateRateBps(rateBps: number): void {
  if (
    !Number.isInteger(rateBps) ||
    rateBps < 0 ||
    rateBps > MAX_COMMISSION_BPS
  ) {
    throw new ApiError(
      400,
      "Commission rate must be an integer between 0 and 10000 basis points",
      "INVALID_COMMISSION_RATE",
    );
  }
}

/**
 * Read the global policy using the current escrow transaction.
 */
export async function getGlobalCommissionPolicy(tx: Prisma.TransactionClient) {
  const policy = await tx.platformCommissionPolicy.findUnique({
    where: { id: GLOBAL_POLICY_ID },
  });

  if (!policy || !policy.isActive) {
    throw new ApiError(
      409,
      "ROA's global commission policy is missing or inactive",
      "COMMISSION_POLICY_NOT_CONFIGURED",
    );
  }

  validateRateBps(policy.rateBps);

  return policy;
}

/**
 * Read ROA's active commission rate for display purposes.
 *
 * This is separate from the transaction-based reader used by
 * escrow settlement.
 */
export async function getPublicCommissionRate() {
  const policy = await prisma.platformCommissionPolicy.findUnique({
    where: { id: GLOBAL_POLICY_ID },
    select: {
      rateBps: true,
      isActive: true,
    },
  });

  if (!policy || !policy.isActive) {
    throw new ApiError(
      409,
      "ROA's global commission policy is missing or inactive",
      "COMMISSION_POLICY_NOT_CONFIGURED",
    );
  }

  validateRateBps(policy.rateBps);

  return {
    rateBps: policy.rateBps,
  };
}

/**
 * Return the current commission rate to an authenticated seller
 * who owns an active ROA store.
 */
export async function getSellerCommissionRate(ownerId: string) {
  const store = await prisma.store.findUnique({
    where: {
      ownerId,
    },
    select: {
      status: true,
    },
  });

  if (!store) {
    throw new ApiError(
      403,
      "You must have a store to view the seller commission rate",
      "STORE_REQUIRED",
    );
  }

  if (store.status !== "ACTIVE") {
    throw new ApiError(
      403,
      "Your store must be active to view the seller commission rate",
      "STORE_NOT_ACTIVE",
    );
  }

  return getPublicCommissionRate();
}

/**
 * Create or update ROA's global commission policy.
 *
 * Keep this function behind an authorized admin operation
 * when you add the admin controller and route.
 */
export async function configureGlobalCommissionPolicy(
  rateBps: number,
  isActive = true,
) {
  validateRateBps(rateBps);

  return prisma.platformCommissionPolicy.upsert({
    where: { id: GLOBAL_POLICY_ID },
    create: {
      id: GLOBAL_POLICY_ID,
      rateBps,
      isActive,
    },
    update: {
      rateBps,
      isActive,
    },
  });
}
