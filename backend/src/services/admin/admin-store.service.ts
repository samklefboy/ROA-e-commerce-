import { Prisma, StoreStatus } from "../../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type ListAdminStoresInput = {
  status?: StoreStatus;
  search?: string;
  page?: number;
  limit?: number;
};

type StoreStatusChangeInput = {
  storeId: string;
  adminId: string;
  reason: string;
};

const storeListSelect = {
  id: true,
  name: true,
  slug: true,
  handle: true,
  category: true,
  status: true,
  isVerified: true,
  isOpen: true,
  location: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: {
      id: true,
      phone: true,
      isVerified: true,
    },
  },
  _count: {
    select: {
      products: true,
      orders: true,
    },
  },
} satisfies Prisma.StoreSelect;

function validatePagination(page: number, limit: number): void {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new ApiError(
      400,
      "Page must be positive and limit must be between 1 and 100",
      "INVALID_PAGINATION",
    );
  }
}

function normalizeReason(reason: string): string {
  const normalized = reason.trim();

  if (normalized.length < 5 || normalized.length > 1000) {
    throw new ApiError(
      400,
      "Reason must be between 5 and 1000 characters",
      "INVALID_STORE_STATUS_REASON",
    );
  }

  return normalized;
}

function isStoreSetupComplete(store: {
  category: string | null;
  about: string | null;
  whatsapp: string | null;
  location: string | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
}): boolean {
  return (
    store.category !== null &&
    Boolean(store.about?.trim()) &&
    Boolean(store.whatsapp?.trim()) &&
    Boolean(store.location?.trim()) &&
    store.deliveryDaysMin !== null &&
    store.deliveryDaysMax !== null &&
    store.deliveryDaysMin > 0 &&
    store.deliveryDaysMax >= store.deliveryDaysMin
  );
}

export async function listAdminStores(input: ListAdminStoresInput = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  validatePagination(page, limit);

  const search = input.search?.trim();

  const where: Prisma.StoreWhereInput = {
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { handle: { contains: search, mode: "insensitive" } },
            { owner: { phone: { contains: search } } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.store.findMany({
      where,
      select: storeListSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.store.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminStoreById(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      ...storeListSelect,
      tagline: true,
      about: true,
      logo: true,
      coverImage: true,
      email: true,
      whatsapp: true,
      deliveryDaysMin: true,
      deliveryDaysMax: true,
      pickupEnabled: true,
      pickupAddress: true,
      pickupInstructions: true,
      socialLinks: true,
      policies: true,
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          price: true,
          stock: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          currency: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!store) {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  return store;
}

export async function suspendAdminStore(input: StoreStatusChangeInput) {
  const reason = normalizeReason(input.reason);

  return prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({
      where: { id: input.storeId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
      },
    });

    if (!store) {
      throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
    }

    if (store.status !== StoreStatus.ACTIVE) {
      throw new ApiError(
        409,
        "Only an active store can be suspended",
        "STORE_NOT_ACTIVE",
      );
    }

    const updateResult = await tx.store.updateMany({
      where: {
        id: store.id,
        status: StoreStatus.ACTIVE,
      },
      data: {
        status: StoreStatus.SUSPENDED,
      },
    });

    if (updateResult.count !== 1) {
      throw new ApiError(
        409,
        "Store status changed. Refresh and try again",
        "STORE_STATUS_CHANGED",
      );
    }

    await tx.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: input.adminId,
        userId: store.ownerId,
        action: "STORE_SUSPENDED",
        reference: store.id,
        metadata: {
          storeId: store.id,
          storeName: store.name,
          previousStatus: StoreStatus.ACTIVE,
          newStatus: StoreStatus.SUSPENDED,
          reason,
        },
      },
    });

    await tx.notification.create({
      data: {
        recipientId: store.ownerId,
        type: "STORE_SUSPENDED",
        title: "Your store has been suspended",
        message:
          "Your store has been suspended by ROA administration. Please review the reason and contact support if you need clarification.",
        data: {
          storeId: store.id,
          storeName: store.name,
          status: StoreStatus.SUSPENDED,
          reason,
        },
      },
    });

    return tx.store.findUniqueOrThrow({
      where: { id: store.id },
      select: storeListSelect,
    });
  });
}

export async function reinstateAdminStore(input: StoreStatusChangeInput) {
  const reason = normalizeReason(input.reason);

  return prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({
      where: { id: input.storeId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
        category: true,
        about: true,
        whatsapp: true,
        location: true,
        deliveryDaysMin: true,
        deliveryDaysMax: true,
      },
    });

    if (!store) {
      throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
    }

    if (store.status !== StoreStatus.SUSPENDED) {
      throw new ApiError(
        409,
        "Only a suspended store can be reinstated",
        "STORE_NOT_SUSPENDED",
      );
    }

    if (!isStoreSetupComplete(store)) {
      throw new ApiError(
        409,
        "Store setup is incomplete. The store owner must complete the required setup before reinstatement",
        "STORE_SETUP_INCOMPLETE",
      );
    }

    const updateResult = await tx.store.updateMany({
      where: {
        id: store.id,
        status: StoreStatus.SUSPENDED,
      },
      data: {
        status: StoreStatus.ACTIVE,
      },
    });

    if (updateResult.count !== 1) {
      throw new ApiError(
        409,
        "Store status changed. Refresh and try again",
        "STORE_STATUS_CHANGED",
      );
    }

    await tx.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: input.adminId,
        userId: store.ownerId,
        action: "STORE_REINSTATED",
        reference: store.id,
        metadata: {
          storeId: store.id,
          storeName: store.name,
          previousStatus: StoreStatus.SUSPENDED,
          newStatus: StoreStatus.ACTIVE,
          reason,
        },
      },
    });

    await tx.notification.create({
      data: {
        recipientId: store.ownerId,
        type: "STORE_REINSTATED",
        title: "Your store has been reinstated",
        message:
          "ROA administration has reinstated your store. You can resume normal store operations.",
        data: {
          storeId: store.id,
          storeName: store.name,
          status: StoreStatus.ACTIVE,
          reason,
        },
      },
    });

    return tx.store.findUniqueOrThrow({
      where: { id: store.id },
      select: storeListSelect,
    });
  });
}
