import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

type PromotionInput = {
  title?: string;
  message?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
};

type CreatePromotionInput = PromotionInput & {
  title: string;
};

type UpdatePromotionInput = PromotionInput;

function normalizeOptionalText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(
  value: string | Date | null | undefined,
  fieldName: string,
): Date | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  return date;
}

function validatePromotionFields(input: PromotionInput): void {
  const startsAt = parseDate(input.startsAt, "Start date");
  const endsAt = parseDate(input.endsAt, "End date");

  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new ApiError(
      400,
      "Promotion end date must be later than its start date",
      "INVALID_PROMOTION_SCHEDULE",
    );
  }

  const ctaLabel = normalizeOptionalText(input.ctaLabel);
  const ctaUrl = normalizeOptionalText(input.ctaUrl);

  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    throw new ApiError(
      400,
      "Call-to-action label and URL must be provided together",
      "INVALID_PROMOTION_CTA",
    );
  }

  if (ctaUrl) {
    let url: URL;

    try {
      url = new URL(ctaUrl);
    } catch {
      throw new ApiError(
        400,
        "Call-to-action URL must be a valid URL",
        "INVALID_PROMOTION_CTA_URL",
      );
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new ApiError(
        400,
        "Call-to-action URL must use HTTP or HTTPS",
        "INVALID_PROMOTION_CTA_URL",
      );
    }
  }
}

function toPromotionDates(input: PromotionInput) {
  const startsAt = parseDate(input.startsAt, "Start date");
  const endsAt = parseDate(input.endsAt, "End date");

  return {
    ...(startsAt !== undefined ? { startsAt } : {}),
    ...(endsAt !== undefined ? { endsAt } : {}),
  };
}

async function getOwnedStore(ownerId: string) {
  const store = await prisma.store.findUnique({
    where: { ownerId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!store) {
    throw new ApiError(404, "You do not have a store", "STORE_NOT_FOUND");
  }

  return store;
}

async function getOwnedPromotion(ownerId: string, promotionId: string) {
  const promotion = await prisma.storePromotion.findFirst({
    where: {
      id: promotionId,
      store: {
        ownerId,
      },
    },
  });

  if (!promotion) {
    throw new ApiError(404, "Promotion not found", "PROMOTION_NOT_FOUND");
  }

  return promotion;
}

function assertStoreCanPublish(status: string): void {
  if (status !== "ACTIVE") {
    throw new ApiError(
      409,
      "Your store must be active before you can publish promotions",
      "STORE_NOT_ACTIVE",
    );
  }
}

function assertPromotionCanPublish(promotion: {
  title: string;
  startsAt: Date | null;
  endsAt: Date | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}): void {
  if (!promotion.title.trim()) {
    throw new ApiError(
      400,
      "A promotion headline is required before publishing",
      "PROMOTION_TITLE_REQUIRED",
    );
  }

  validatePromotionFields({
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    ctaLabel: promotion.ctaLabel,
    ctaUrl: promotion.ctaUrl,
  });
}

export async function listMyPromotions(ownerId: string, page = 1, limit = 20) {
  const store = await getOwnedStore(ownerId);

  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [promotions, total] = await prisma.$transaction([
    prisma.storePromotion.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: safeLimit,
    }),
    prisma.storePromotion.count({
      where: {
        storeId: store.id,
      },
    }),
  ]);

  return {
    promotions,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasMore: skip + promotions.length < total,
    },
  };
}

export async function createStorePromotion(
  ownerId: string,
  input: CreatePromotionInput,
) {
  const store = await getOwnedStore(ownerId);

  const title = input.title.trim();
  const message = normalizeOptionalText(input.message);
  const imageUrl = normalizeOptionalText(input.imageUrl);
  const ctaLabel = normalizeOptionalText(input.ctaLabel);
  const ctaUrl = normalizeOptionalText(input.ctaUrl);

  if (!title) {
    throw new ApiError(
      400,
      "Promotion headline is required",
      "PROMOTION_TITLE_REQUIRED",
    );
  }

  validatePromotionFields({
    ...(input.startsAt !== undefined && {
      startsAt: input.startsAt,
    }),
    ...(input.endsAt !== undefined && {
      endsAt: input.endsAt,
    }),
    ...(ctaLabel !== undefined && { ctaLabel }),
    ...(ctaUrl !== undefined && { ctaUrl }),
  });

  return prisma.storePromotion.create({
    data: {
      storeId: store.id,
      title,
      ...(message !== undefined && { message }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(ctaLabel !== undefined && { ctaLabel }),
      ...(ctaUrl !== undefined && { ctaUrl }),
      ...toPromotionDates(input),
      status: "DRAFT",
    },
  });
}

export async function updateStorePromotion(
  ownerId: string,
  promotionId: string,
  input: UpdatePromotionInput,
) {
  const existing = await getOwnedPromotion(ownerId, promotionId);

  if (existing.status === "ARCHIVED") {
    throw new ApiError(
      409,
      "Archived promotions cannot be edited",
      "PROMOTION_ARCHIVED",
    );
  }

  validatePromotionFields({
    startsAt: input.startsAt !== undefined ? input.startsAt : existing.startsAt,
    endsAt: input.endsAt !== undefined ? input.endsAt : existing.endsAt,
    ctaLabel: input.ctaLabel !== undefined ? input.ctaLabel : existing.ctaLabel,
    ctaUrl: input.ctaUrl !== undefined ? input.ctaUrl : existing.ctaUrl,
  });

  const title = input.title === undefined ? undefined : input.title.trim();

  if (title !== undefined && !title) {
    throw new ApiError(
      400,
      "Promotion headline cannot be empty",
      "PROMOTION_TITLE_REQUIRED",
    );
  }

  const updated = await prisma.storePromotion.update({
    where: {
      id: existing.id,
    },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(input.message !== undefined
        ? { message: normalizeOptionalText(input.message) ?? null }
        : {}),
      ...(input.imageUrl !== undefined
        ? { imageUrl: normalizeOptionalText(input.imageUrl) ?? null }
        : {}),
      ...(input.ctaLabel !== undefined
        ? { ctaLabel: normalizeOptionalText(input.ctaLabel) ?? null }
        : {}),
      ...(input.ctaUrl !== undefined
        ? { ctaUrl: normalizeOptionalText(input.ctaUrl) ?? null }
        : {}),
      ...toPromotionDates(input),
    },
  });

  if (updated.status === "PUBLISHED") {
    assertPromotionCanPublish(updated);
  }

  return updated;
}

export async function publishStorePromotion(
  ownerId: string,
  promotionId: string,
) {
  const store = await getOwnedStore(ownerId);
  assertStoreCanPublish(store.status);

  const promotion = await getOwnedPromotion(ownerId, promotionId);

  if (promotion.status === "ARCHIVED") {
    throw new ApiError(
      409,
      "Archived promotions cannot be published",
      "PROMOTION_ARCHIVED",
    );
  }

  assertPromotionCanPublish(promotion);

  const now = new Date();

  if (promotion.endsAt && promotion.endsAt <= now) {
    throw new ApiError(
      400,
      "This promotion's end date has already passed",
      "PROMOTION_ALREADY_EXPIRED",
    );
  }

  return prisma.storePromotion.update({
    where: {
      id: promotion.id,
    },
    data: {
      status: "PUBLISHED",
    },
  });
}

export async function archiveStorePromotion(
  ownerId: string,
  promotionId: string,
) {
  const promotion = await getOwnedPromotion(ownerId, promotionId);

  if (promotion.status === "ARCHIVED") {
    return promotion;
  }

  return prisma.storePromotion.update({
    where: {
      id: promotion.id,
    },
    data: {
      status: "ARCHIVED",
    },
  });
}

export async function getPublicStorePromotions(slug: string) {
  const store = await prisma.store.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!store || store.status !== "ACTIVE") {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  const now = new Date();

  const promotions = await prisma.storePromotion.findMany({
    where: {
      storeId: store.id,
      status: "PUBLISHED",
      AND: [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      message: true,
      imageUrl: true,
      ctaLabel: true,
      ctaUrl: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
    },
  });

  return { promotions };
}
