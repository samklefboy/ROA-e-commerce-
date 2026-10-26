import { Prisma } from "../../../generated/prisma/client.js";
import {
  WalletLedgerType,
  WalletOwnerType,
} from "../../../generated/prisma/enums.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type DbClient = Prisma.TransactionClient;

interface CreateLedgerEntryInput {
  walletId: string;
  type: WalletLedgerType;
  amount: Prisma.Decimal;
  reference: string;
  idempotencyKey: string;
  description?: string;
  orderId?: string;
  escrowId?: string;
  paymentId?: string;
  withdrawalId?: string;
  refundId?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createWalletLedgerEntry(
  db: DbClient,
  input: CreateLedgerEntryInput,
) {
  const wallet = await db.wallet.findUnique({
    where: {
      id: input.walletId,
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  if (!wallet.isActive) {
    throw new ApiError(403, "Wallet is inactive");
  }

  const ledgerEntry = await db.walletLedger.create({
    data: {
      walletId: wallet.id,

      type: input.type,
      status: "COMPLETED",

      amount: input.amount,
      currency: wallet.currency,

      availableBalanceBefore: wallet.availableBalance,
      availableBalanceAfter: wallet.availableBalance,

      heldBalanceBefore: wallet.heldBalance,
      heldBalanceAfter: wallet.heldBalance,

      reference: input.reference,
      idempotencyKey: input.idempotencyKey,

      ...(input.description !== undefined && {
        description: input.description,
      }),

      ...(input.orderId !== undefined && {
        orderId: input.orderId,
      }),

      ...(input.escrowId !== undefined && {
        escrowId: input.escrowId,
      }),

      ...(input.paymentId !== undefined && {
        paymentId: input.paymentId,
      }),

      ...(input.withdrawalId !== undefined && {
        withdrawalId: input.withdrawalId,
      }),

      ...(input.refundId !== undefined && {
        refundId: input.refundId,
      }),

      ...(input.metadata !== undefined && {
        metadata: input.metadata,
      }),
    },
  });

  return ledgerEntry;
}

export async function creditWallet(
  userId: string,
  amount: Prisma.Decimal,
  input: {
    type: WalletLedgerType;
    reference: string;
    idempotencyKey: string;
    description?: string;
    paymentId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return prisma.$transaction(async (tx) => {
    const existingEntry = await tx.walletLedger.findUnique({
      where: {
        idempotencyKey: input.idempotencyKey,
      },
    });

    if (existingEntry) {
      return {
        wallet: await tx.wallet.findUnique({
          where: {
            userId,
          },
          select: {
            id: true,
            availableBalance: true,
            heldBalance: true,
            currency: true,
          },
        }),
        ledgerEntry: existingEntry,
        alreadyProcessed: true,
      };
    }

    const lockedWallet = await tx.$queryRaw<
      Array<{
        id: string;
        userId: string | null;
        ownerType: WalletOwnerType;
        availableBalance: Prisma.Decimal;
        heldBalance: Prisma.Decimal;
        currency: string;
        isActive: boolean;
      }>
    >(
      Prisma.sql`
    SELECT
      "id",
      "userId",
      "ownerType",
      "availableBalance",
      "heldBalance",
      "currency",
      "isActive"
    FROM "Wallet"
    WHERE "userId" = ${userId}
    FOR UPDATE
  `,
    );

    const wallet = lockedWallet[0];

    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    if (!wallet.isActive) {
      throw new ApiError(403, "Wallet is inactive");
    }

    if (amount.lessThanOrEqualTo(0)) {
      throw new ApiError(400, "Wallet credit amount must be greater than zero");
    }

    const balanceBefore = wallet.availableBalance;

    const balanceAfter = balanceBefore.plus(amount);

    const updatedWallet = await tx.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        availableBalance: balanceAfter,
      },
      select: {
        id: true,
        availableBalance: true,
        heldBalance: true,
        currency: true,
      },
    });

    const ledgerEntry = await createWalletLedgerEntry(tx, {
      walletId: wallet.id,
      type: input.type,
      amount,
      reference: input.reference,
      idempotencyKey: input.idempotencyKey,

      ...(input.description !== undefined && {
        description: input.description,
      }),

      ...(input.paymentId !== undefined && {
        paymentId: input.paymentId,
      }),
    });

    await tx.walletLedger.update({
      where: {
        id: ledgerEntry.id,
      },
      data: {
        availableBalanceBefore: balanceBefore,
        availableBalanceAfter: balanceAfter,
        heldBalanceBefore: wallet.heldBalance,
        heldBalanceAfter: wallet.heldBalance,
      },
    });

    return {
      wallet: updatedWallet,
      ledgerEntry,
      alreadyProcessed: false,
    };
  });
}

export async function getWalletLedger(
  userId: string,
  options?: {
    limit?: number;
    cursor?: string;
  },
) {
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

  const wallet = await prisma.wallet.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  return prisma.walletLedger.findMany({
    where: {
      walletId: wallet.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    ...(options?.cursor
      ? {
          skip: 1,
          cursor: {
            id: options.cursor,
          },
        }
      : {}),
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      currency: true,
      availableBalanceBefore: true,
      availableBalanceAfter: true,
      heldBalanceBefore: true,
      heldBalanceAfter: true,
      reference: true,
      description: true,
      createdAt: true,
    },
  });
}
