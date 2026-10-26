import {
  Prisma,
  StoreReportReason,
  StoreReportStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const storeReportInclude = {
  reporter: {
    select: {
      id: true,
    },
  },
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
    },
  },
  order: {
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.StoreReportInclude;

type CreateStoreReportInput = {
  storeId: string;
  orderId?: string | null;
  reason: StoreReportReason;
  description: string;
};

type ListStoreReportsInput = {
  page?: number;
  limit?: number;
  status?: StoreReportStatus;
  reason?: StoreReportReason;
  storeId?: string;
  reporterId?: string;
};

type ReviewStoreReportInput = {
  status: StoreReportStatus;
  adminNotes?: string | null;
};

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(
      400,
      `${fieldName} is required`,
      "STORE_REPORT_VALIDATION_ERROR",
    );
  }

  return value.trim();
}

function normalizeDescription(value: unknown): string {
  if (typeof value !== "string") {
    throw new ApiError(
      400,
      "A report description is required",
      "STORE_REPORT_DESCRIPTION_REQUIRED",
    );
  }

  const description = value.trim();

  if (description.length < 10) {
    throw new ApiError(
      400,
      "The report description must contain at least 10 characters",
      "STORE_REPORT_DESCRIPTION_TOO_SHORT",
    );
  }

  if (description.length > 5000) {
    throw new ApiError(
      400,
      "The report description cannot exceed 5000 characters",
      "STORE_REPORT_DESCRIPTION_TOO_LONG",
    );
  }

  return description;
}

function normalizeAdminNotes(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiError(
      400,
      "Admin notes must be a string",
      "STORE_REPORT_ADMIN_NOTES_INVALID",
    );
  }

  const notes = value.trim();

  if (notes.length > 5000) {
    throw new ApiError(
      400,
      "Admin notes cannot exceed 5000 characters",
      "STORE_REPORT_ADMIN_NOTES_TOO_LONG",
    );
  }

  return notes.length > 0 ? notes : null;
}

function normalizePagination(input: { page?: number; limit?: number }) {
  const page = input.page ?? DEFAULT_PAGE;
  const limit = input.limit ?? DEFAULT_LIMIT;

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new ApiError(
      400,
      "Page must be a positive integer",
      "STORE_REPORT_PAGE_INVALID",
    );
  }

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ApiError(
      400,
      `Limit must be between 1 and ${MAX_LIMIT}`,
      "STORE_REPORT_LIMIT_INVALID",
    );
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function isStoreReportReason(value: unknown): value is StoreReportReason {
  return (
    typeof value === "string" &&
    Object.values(StoreReportReason).includes(value as StoreReportReason)
  );
}

function isStoreReportStatus(value: unknown): value is StoreReportStatus {
  return (
    typeof value === "string" &&
    Object.values(StoreReportStatus).includes(value as StoreReportStatus)
  );
}

/**
 * Buyer submits a report against a store.
 *
 * Creating a report does not suspend, close, or otherwise
 * change the store.
 */
export async function createStoreReport(
  reporterId: string,
  input: CreateStoreReportInput,
) {
  const buyerId = requiredString(reporterId, "Reporter ID");
  const storeId = requiredString(input.storeId, "Store ID");
  const description = normalizeDescription(input.description);

  if (!isStoreReportReason(input.reason)) {
    throw new ApiError(
      400,
      "Invalid store report reason",
      "STORE_REPORT_REASON_INVALID",
    );
  }

  const orderId =
    input.orderId == null ? null : requiredString(input.orderId, "Order ID");

  return prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!store) {
      throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
    }

    if (store.ownerId === buyerId) {
      throw new ApiError(
        400,
        "You cannot report your own store",
        "CANNOT_REPORT_OWN_STORE",
      );
    }

    if (orderId) {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          userId: buyerId,
          storeId,
        },
        select: {
          id: true,
        },
      });

      if (!order) {
        throw new ApiError(
          400,
          "The selected order does not belong to you and this store",
          "STORE_REPORT_ORDER_INVALID",
        );
      }
    }

    const report = await tx.storeReport.create({
      data: {
        reporterId: buyerId,
        storeId,
        orderId,
        reason: input.reason,
        description,
      },
      include: storeReportInclude,
    });

    return report;
  });
}

/**
 * Buyer retrieves their own store reports.
 */
export async function listMyStoreReports(
  reporterId: string,
  input: Pick<ListStoreReportsInput, "page" | "limit" | "status"> = {},
) {
  const buyerId = requiredString(reporterId, "Reporter ID");
  const { page, limit, skip } = normalizePagination(input);

  if (input.status !== undefined && !isStoreReportStatus(input.status)) {
    throw new ApiError(
      400,
      "Invalid store report status",
      "STORE_REPORT_STATUS_INVALID",
    );
  }

  const where: Prisma.StoreReportWhereInput = {
    reporterId: buyerId,
    ...(input.status ? { status: input.status } : {}),
  };

  const [reports, total] = await prisma.$transaction([
    prisma.storeReport.findMany({
      where,
      include: storeReportInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.storeReport.count({ where }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Admin retrieves store reports with optional filters.
 */
export async function listAdminStoreReports(input: ListStoreReportsInput = {}) {
  const { page, limit, skip } = normalizePagination(input);

  if (input.status !== undefined && !isStoreReportStatus(input.status)) {
    throw new ApiError(
      400,
      "Invalid store report status",
      "STORE_REPORT_STATUS_INVALID",
    );
  }

  if (input.reason !== undefined && !isStoreReportReason(input.reason)) {
    throw new ApiError(
      400,
      "Invalid store report reason",
      "STORE_REPORT_REASON_INVALID",
    );
  }

  const where: Prisma.StoreReportWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.storeId
      ? { storeId: requiredString(input.storeId, "Store ID") }
      : {}),
    ...(input.reporterId
      ? {
          reporterId: requiredString(input.reporterId, "Reporter ID"),
        }
      : {}),
  };

  const [reports, total] = await prisma.$transaction([
    prisma.storeReport.findMany({
      where,
      include: storeReportInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.storeReport.count({ where }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Admin retrieves one report.
 */
export async function getAdminStoreReport(reportId: string) {
  const id = requiredString(reportId, "Report ID");

  const report = await prisma.storeReport.findUnique({
    where: { id },
    include: storeReportInclude,
  });

  if (!report) {
    throw new ApiError(404, "Store report not found", "STORE_REPORT_NOT_FOUND");
  }

  return report;
}

/**
 * Admin updates a report's review status and notes.
 *
 * Allowed transitions:
 * OPEN -> UNDER_REVIEW, RESOLVED, DISMISSED
 * UNDER_REVIEW -> RESOLVED, DISMISSED
 *
 * RESOLVED and DISMISSED reports are terminal.
 * Store suspension is deliberately not performed here.
 */
export async function reviewAdminStoreReport(
  reviewerId: string,
  reportId: string,
  input: ReviewStoreReportInput,
) {
  const adminId = requiredString(reviewerId, "Reviewer ID");
  const id = requiredString(reportId, "Report ID");

  if (!isStoreReportStatus(input.status)) {
    throw new ApiError(
      400,
      "Invalid store report status",
      "STORE_REPORT_STATUS_INVALID",
    );
  }

  if (input.status === StoreReportStatus.OPEN) {
    throw new ApiError(
      400,
      "A reviewed report cannot be moved back to OPEN",
      "STORE_REPORT_STATUS_TRANSITION_INVALID",
    );
  }

  const adminNotes = normalizeAdminNotes(input.adminNotes);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.storeReport.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      throw new ApiError(
        404,
        "Store report not found",
        "STORE_REPORT_NOT_FOUND",
      );
    }

    if (
      existing.status === StoreReportStatus.RESOLVED ||
      existing.status === StoreReportStatus.DISMISSED
    ) {
      throw new ApiError(
        409,
        "This report has already been closed",
        "STORE_REPORT_ALREADY_CLOSED",
      );
    }

    if (
      input.status !== StoreReportStatus.UNDER_REVIEW &&
      input.status !== StoreReportStatus.RESOLVED &&
      input.status !== StoreReportStatus.DISMISSED
    ) {
      throw new ApiError(
        400,
        "Unsupported store report status transition",
        "STORE_REPORT_STATUS_TRANSITION_INVALID",
      );
    }

    if (
      input.status === StoreReportStatus.UNDER_REVIEW &&
      existing.status !== StoreReportStatus.OPEN
    ) {
      throw new ApiError(
        409,
        "Only open reports can be moved under review",
        "STORE_REPORT_STATUS_TRANSITION_INVALID",
      );
    }

    if (
      (input.status === StoreReportStatus.RESOLVED ||
        input.status === StoreReportStatus.DISMISSED) &&
      !adminNotes
    ) {
      throw new ApiError(
        400,
        "Admin notes are required when resolving or dismissing a report",
        "STORE_REPORT_ADMIN_NOTES_REQUIRED",
      );
    }

    // Conditional update prevents two admins from silently
    // reviewing the same OPEN report at the same time.
    const allowedPreviousStatuses =
      input.status === StoreReportStatus.UNDER_REVIEW
        ? [StoreReportStatus.OPEN]
        : [StoreReportStatus.OPEN, StoreReportStatus.UNDER_REVIEW];

    const updated = await tx.storeReport.updateMany({
      where: {
        id,
        status: { in: allowedPreviousStatuses },
      },
      data: {
        status: input.status,
        adminNotes,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new ApiError(
        409,
        "The report was updated by another request. Refresh and try again.",
        "STORE_REPORT_CONCURRENT_UPDATE",
      );
    }

    return tx.storeReport.findUniqueOrThrow({
      where: { id },
      include: storeReportInclude,
    });
  });
}
