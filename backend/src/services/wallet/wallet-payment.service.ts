import { Prisma } from "../../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { requireUserWallet } from "./wallet.service.js";

type WalletPaymentInput = {
  userId: string;
  orderId: string;
  amount: number;
  currency?: string;
  idempotencyKey: string;
  description?: string;
};

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function holdWalletForOrder(
  tx: Prisma.TransactionClient,
  input: WalletPaymentInput,
) {
  const amount = money(input.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, "Wallet payment amount must be greater than zero");
  }

  if (!input.idempotencyKey.trim()) {
    throw new ApiError(400, "Wallet payment idempotency key is required");
  }

  /*
   * If this exact payment has already been processed,
   * return it instead of charging the wallet again.
   */
  const existingLedger = await tx.walletLedger.findUnique({
    where: {
      idempotencyKey: input.idempotencyKey,
    },
  });

  if (existingLedger) {
    if (
      existingLedger.orderId !== input.orderId ||
      Number(existingLedger.amount) !== amount
    ) {
      throw new ApiError(
        409,
        "This payment idempotency key has already been used",
      );
    }

    return {
      walletId: existingLedger.walletId,
      ledger: existingLedger,
      alreadyProcessed: true,
    };
  }

  const wallet = await requireUserWallet(input.userId, tx);

  if (wallet.currency !== (input.currency ?? wallet.currency)) {
    throw new ApiError(
      400,
      "Wallet currency does not match the order currency",
    );
  }

  const availableBefore = Number(wallet.availableBalance);
  const heldBefore = Number(wallet.heldBalance);

  /*
   * The conditional update makes the balance check
   * race-safe at the database level.
   */
  const updated = await tx.wallet.updateMany({
    where: {
      id: wallet.id,
      isActive: true,
      availableBalance: {
        gte: amount,
      },
    },
    data: {
      availableBalance: {
        decrement: amount,
      },
      heldBalance: {
        increment: amount,
      },
    },
  });

  if (updated.count !== 1) {
    throw new ApiError(
      400,
      "Insufficient wallet balance",
      "INSUFFICIENT_WALLET_BALANCE",
    );
  }

  const walletAfter = await tx.wallet.findUnique({
    where: {
      id: wallet.id,
    },
  });

  if (!walletAfter) {
    throw new ApiError(500, "Wallet could not be loaded after payment hold");
  }

  const availableAfter = Number(walletAfter.availableBalance);
  const heldAfter = Number(walletAfter.heldBalance);

  const ledger = await tx.walletLedger.create({
    data: {
      walletId: wallet.id,
      type: "PURCHASE_HOLD",
      status: "COMPLETED",
      amount,
      currency: input.currency ?? wallet.currency,
      availableBalanceBefore: availableBefore,
      availableBalanceAfter: availableAfter,
      heldBalanceBefore: heldBefore,
      heldBalanceAfter: heldAfter,
      orderId: input.orderId,
      reference: `WALLET-HOLD-${input.orderId}`,
      idempotencyKey: input.idempotencyKey,
      description: input.description ?? "Wallet payment held for order",
      metadata: {
        orderId: input.orderId,
        paymentType: "ORDER",
      } as Prisma.InputJsonValue,
    },
  });

  return {
    walletId: wallet.id,
    ledger,
    alreadyProcessed: false,
  };
}
