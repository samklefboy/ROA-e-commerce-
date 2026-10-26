import { Prisma } from "../../../generated/prisma/client.js";
import {
  WalletLedgerStatus,
  WalletLedgerType,
} from "../../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type DateRange = {
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
};

type TransactionQuery = DateRange & {
  page: number;
  limit: number;
  type?: "TOPUP" | "SALE" | "REFUND" | "PURCHASE" | "WITHDRAWAL" | undefined;
  credit?: boolean | undefined;
  debit?: boolean | undefined;
  status?: WalletLedgerStatus | undefined;
  search?: string | undefined;
};

const CREDIT_TYPES: WalletLedgerType[] = [
  WalletLedgerType.TOPUP,
  WalletLedgerType.ESCROW_RELEASE,
  WalletLedgerType.REFUND,
  WalletLedgerType.ADJUSTMENT,
];

const DEBIT_TYPES: WalletLedgerType[] = [
  WalletLedgerType.PURCHASE_HOLD,
  WalletLedgerType.WITHDRAWAL,
  WalletLedgerType.COMMISSION,
];

function buildDateFilter(range: DateRange) {
  const createdAt: Prisma.DateTimeFilter = {};

  if (range.dateFrom) {
    createdAt.gte = range.dateFrom;
  }

  if (range.dateTo) {
    createdAt.lte = range.dateTo;
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
}

function mapDisplayType(type: WalletLedgerType) {
  switch (type) {
    case WalletLedgerType.TOPUP:
      return "TOPUP";

    case WalletLedgerType.ESCROW_RELEASE:
      return "SALE";

    case WalletLedgerType.REFUND:
      return "REFUND";

    case WalletLedgerType.PURCHASE_HOLD:
      return "PURCHASE";

    case WalletLedgerType.WITHDRAWAL:
      return "WITHDRAWAL";

    case WalletLedgerType.COMMISSION:
      return "PURCHASE";

    case WalletLedgerType.ADJUSTMENT:
      return "REFUND";

    default:
      return type;
  }
}

function buildTransactionCounts(
  groupedCounts: Array<{
    type: WalletLedgerType;
    _count: {
      _all: number;
    };
  }>,
  totalCount: number,
) {
  const counts: Record<
    | "ALL"
    | "CREDIT"
    | "DEBIT"
    | "TOPUP"
    | "WITHDRAWAL"
    | "PURCHASE"
    | "SALE"
    | "REFUND",
    number
  > = {
    ALL: totalCount,
    CREDIT: 0,
    DEBIT: 0,
    TOPUP: 0,
    WITHDRAWAL: 0,
    PURCHASE: 0,
    SALE: 0,
    REFUND: 0,
  };

  for (const group of groupedCounts) {
    const count = group._count._all;
    const displayType = mapDisplayType(group.type);

    if (
      displayType === "TOPUP" ||
      displayType === "WITHDRAWAL" ||
      displayType === "PURCHASE" ||
      displayType === "SALE" ||
      displayType === "REFUND"
    ) {
      counts[displayType] += count;
    }

    if (CREDIT_TYPES.includes(group.type)) {
      counts.CREDIT += count;
    }

    if (DEBIT_TYPES.includes(group.type)) {
      counts.DEBIT += count;
    }
  }

  return counts;
}

export async function getWalletSummary(userId: string, range: DateRange = {}) {
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
    throw new ApiError(404, "Wallet not found for this account.");
  }

  if (!wallet.isActive) {
    throw new ApiError(403, "This wallet is currently inactive.");
  }

  return {
    ...wallet,

    // Alias supports your existing Withdraw page.
    balance: wallet.availableBalance,
  };
}

export async function getWalletTransactions(
  userId: string,
  query: TransactionQuery,
) {
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found for this account.");
  }

  if (!wallet.isActive) {
    throw new ApiError(403, "This wallet is currently inactive.");
  }

  const andFilters: Prisma.WalletLedgerWhereInput[] = [];

  if (query.type) {
    const typeMap: Record<
      NonNullable<TransactionQuery["type"]>,
      WalletLedgerType
    > = {
      TOPUP: WalletLedgerType.TOPUP,
      SALE: WalletLedgerType.ESCROW_RELEASE,
      REFUND: WalletLedgerType.REFUND,
      PURCHASE: WalletLedgerType.PURCHASE_HOLD,
      WITHDRAWAL: WalletLedgerType.WITHDRAWAL,
    };

    andFilters.push({
      type: typeMap[query.type],
    });
  }

  if (query.credit) {
    andFilters.push({
      type: {
        in: CREDIT_TYPES,
      },
    });
  } else if (query.debit) {
    andFilters.push({
      type: {
        in: DEBIT_TYPES,
      },
    });
  }

  if (query.status) {
    andFilters.push({
      status: query.status,
    });
  }

  if (query.search) {
    andFilters.push({
      OR: [
        {
          reference: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const dateFilter = buildDateFilter(query);

  const where: Prisma.WalletLedgerWhereInput = {
    walletId: wallet.id,
    ...dateFilter,
    ...(andFilters.length
      ? {
          AND: andFilters,
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;

  const [entries, total, groupedCounts, failedCount] = await Promise.all([
    prisma.walletLedger.findMany({
      where,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip,
      take: query.limit,
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
    }),

    prisma.walletLedger.count({
      where,
    }),

    prisma.walletLedger.groupBy({
      by: ["type"],
      where,
      _count: {
        _all: true,
      },
    }),

    prisma.walletLedger.count({
      where: {
        ...where,
        status: WalletLedgerStatus.FAILED,
      },
    }),
  ]);

  const transactions = entries.map((entry) => ({
    ...entry,
    type: mapDisplayType(entry.type),
  }));

  const counts = buildTransactionCounts(groupedCounts, total);

  return {
    transactions,
    counts,
    failedCount,
    page: query.page,
    limit: query.limit,
    total,
    hasMore: skip + entries.length < total,
  };
}
