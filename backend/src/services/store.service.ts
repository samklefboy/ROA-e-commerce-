import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

type StoreCategory =
  | "GENERAL"
  | "FASHION"
  | "ELECTRONICS"
  | "SPORTS"
  | "BEAUTY"
  | "HOME"
  | "AUTOMOTIVE"
  | "FOOD"
  | "SERVICES"
  | "EDUCATION"
  | "HEALTH"
  | "TRAVEL"
  | "ENTERTAINMENT"
  | "ART"
  | "AGRICULTURE"
  | "MUSIC"
  | "REAL_ESTATE"
  | "OTHER";

type StorePolicy = {
  label: string;
  value: string;
};

type CreateStoreInput = {
  name: string;
  slug: string;
  handle?: string | null;
  tagline?: string | null;
  about?: string | null;
  logo?: string | null;
  coverImage?: string | null;
};

type UpdateStoreInput = {
  name?: string;
  slug?: string;
  handle?: string | null;
  tagline?: string | null;
  about?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  deliveryDaysMin?: number | null;
  deliveryDaysMax?: number | null;
  category?: StoreCategory;
  socialLinks?: Record<string, string> | null;
  policies?: StorePolicy[] | null;
  isOpen?: boolean;
};

export type PayoutAccountInput = {
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

type StoreSetupFields = {
  category: string | null;
  about: string | null;
  whatsapp: string | null;
  location: string | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
};

function isStoreSetupComplete(store: StoreSetupFields): boolean {
  const hasCategory =
    typeof store.category === "string" && store.category.trim().length > 0;

  const hasAbout =
    typeof store.about === "string" && store.about.trim().length > 0;

  const hasWhatsapp =
    typeof store.whatsapp === "string" && store.whatsapp.trim().length > 0;

  const hasLocation =
    typeof store.location === "string" && store.location.trim().length > 0;

  const hasDeliveryDays =
    store.deliveryDaysMin !== null &&
    store.deliveryDaysMax !== null &&
    store.deliveryDaysMin > 0 &&
    store.deliveryDaysMax >= store.deliveryDaysMin;

  return (
    hasCategory && hasAbout && hasWhatsapp && hasLocation && hasDeliveryDays
  );
}

function buildTrust(store: { isVerified: boolean; policies: unknown }) {
  const trust: string[] = [];

  if (store.isVerified) {
    trust.push("Verified Seller");
  }

  trust.push("Secure Checkout");

  if (!Array.isArray(store.policies)) {
    return trust;
  }

  const labels = new Set(
    store.policies
      .filter(
        (policy): policy is { label: string; value: unknown } =>
          typeof policy === "object" &&
          policy !== null &&
          "label" in policy &&
          typeof policy.label === "string",
      )
      .map((policy) => policy.label.trim().toLowerCase()),
  );

  if (labels.has("returns")) trust.push("Returns Available");
  if (labels.has("support")) trust.push("24/7 Support");
  if (labels.has("warranty")) trust.push("Warranty Guarantee");
  if (labels.has("quality")) trust.push("Quality Assured");

  return trust;
}

function buildStats(
  store: {
    followerCount: number;
    ratingStars: Prisma.Decimal;
    ratingCount: number;
    deliveryDaysMin: number | null;
    deliveryDaysMax: number | null;
  },
  activeProductCount: number,
) {
  return [
    {
      value: String(activeProductCount),
      label: "Products",
    },
    {
      value:
        store.ratingCount > 0
          ? `${Number(store.ratingStars).toFixed(1)}/5`
          : "New",
      label: "Rating",
    },
    {
      value: String(store.followerCount),
      label: "Followers",
    },
    {
      value:
        store.deliveryDaysMin !== null && store.deliveryDaysMax !== null
          ? `${store.deliveryDaysMin}-${store.deliveryDaysMax} days`
          : "Not set",
      label: "Delivery",
    },
  ];
}

function buildStoreResponse(
  store: {
    id: string;
    name: string;
    slug: string;
    handle: string | null;
    tagline: string | null;
    about: string | null;
    logo: string | null;
    coverImage: string | null;
    email: string | null;
    whatsapp: string | null;
    location: string | null;
    category: string | null;
    isOpen: boolean;
    isVerified: boolean;
    status: string;
    ratingStars: Prisma.Decimal;
    ratingCount: number;
    followerCount: number;
    deliveryDaysMin: number | null;
    deliveryDaysMax: number | null;
    socialLinks: unknown;
    policies: unknown;
    bankDetails: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
  activeProductCount: number,
) {
  const setupComplete = isStoreSetupComplete({
    category: store.category,
    about: store.about,
    whatsapp: store.whatsapp,
    location: store.location,
    deliveryDaysMin: store.deliveryDaysMin,
    deliveryDaysMax: store.deliveryDaysMax,
  });

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    handle: store.handle,
    tagline: store.tagline,
    about: store.about,
    logo: store.logo,
    coverImage: store.coverImage,
    email: store.email,
    whatsapp: store.whatsapp,
    location: store.location,
    category: store.category,
    isOpen: store.isOpen,
    isVerified: store.isVerified,
    verified: store.isVerified,
    status: store.status,
    setupComplete,
    payoutSetupComplete: store.bankDetails !== null,
    ratingStars: Number(store.ratingStars),
    ratingCount: store.ratingCount,
    followerCount: store.followerCount,
    deliveryDaysMin: store.deliveryDaysMin,
    deliveryDaysMax: store.deliveryDaysMax,
    socialLinks: store.socialLinks,
    policies: store.policies,
    trust: buildTrust(store),
    stats: buildStats(store, activeProductCount),
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

/**
 * Counts only publicly available products.
 * Draft, archived and hidden products are excluded.
 */
async function getActiveProductCount(storeId: string): Promise<number> {
  return prisma.product.count({
    where: {
      storeId,
      status: "ACTIVE",
    },
  });
}

function throwStoreConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(",")
      : String(error.meta?.target ?? "");

    if (target.includes("slug")) {
      throw new ApiError(
        409,
        "That store slug is already in use",
        "STORE_SLUG_TAKEN",
      );
    }

    if (target.includes("handle")) {
      throw new ApiError(
        409,
        "That store handle is already in use",
        "STORE_HANDLE_TAKEN",
      );
    }

    if (target.includes("ownerId")) {
      throw new ApiError(
        409,
        "You already have a store",
        "STORE_ALREADY_EXISTS",
      );
    }

    throw new ApiError(409, "Store already exists", "STORE_CONFLICT");
  }

  throw error;
}

function maskPayoutAccount(bankDetails: unknown) {
  if (
    typeof bankDetails !== "object" ||
    bankDetails === null ||
    Array.isArray(bankDetails)
  ) {
    return null;
  }

  const details = bankDetails as Record<string, unknown>;

  const accountNumber =
    typeof details.accountNumber === "string" ? details.accountNumber : "";

  return {
    bankCode: typeof details.bankCode === "string" ? details.bankCode : "",
    bankName: typeof details.bankName === "string" ? details.bankName : "",
    accountName:
      typeof details.accountName === "string" ? details.accountName : "",
    accountNumber:
      accountNumber.length >= 4 ? `******${accountNumber.slice(-4)}` : "****",
  };
}

export async function createStore(ownerId: string, input: CreateStoreInput) {
  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    select: {
      id: true,
      hasStore: true,
      store: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (user.hasStore || user.store) {
    throw new ApiError(409, "You already have a store", "STORE_ALREADY_EXISTS");
  }

  try {
    const store = await prisma.$transaction(async (tx) => {
      const createdStore = await tx.store.create({
        data: {
          name: input.name,
          slug: input.slug,

          ...(input.handle !== undefined && {
            handle: input.handle,
          }),

          ...(input.tagline !== undefined && {
            tagline: input.tagline,
          }),

          ...(input.about !== undefined && {
            about: input.about,
          }),

          ...(input.logo !== undefined && {
            logo: input.logo,
          }),

          ...(input.coverImage !== undefined && {
            coverImage: input.coverImage,
          }),

          owner: {
            connect: {
              id: ownerId,
            },
          },
        },
      });

      await tx.user.update({
        where: {
          id: ownerId,
        },
        data: {
          hasStore: true,
        },
      });

      return createdStore;
    });

    return buildStoreResponse(store, 0);
  } catch (error) {
    throwStoreConflict(error);
  }
}

export async function getStoreBySlug(slug: string) {
  const store = await prisma.store.findUnique({
    where: {
      slug,
    },
  });

  if (!store || store.status !== "ACTIVE") {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  const activeProductCount = await getActiveProductCount(store.id);

  return buildStoreResponse(store, activeProductCount);
}

export async function getMyStore(ownerId: string) {
  const store = await prisma.store.findUnique({
    where: {
      ownerId,
    },
  });

  if (!store) {
    throw new ApiError(404, "You do not have a store", "STORE_NOT_FOUND");
  }

  const activeProductCount = await getActiveProductCount(store.id);

  return buildStoreResponse(store, activeProductCount);
}

export async function updateStore(ownerId: string, input: UpdateStoreInput) {
  const existingStore = await prisma.store.findUnique({
    where: {
      ownerId,
    },
  });

  if (!existingStore) {
    throw new ApiError(404, "You do not have a store", "STORE_NOT_FOUND");
  }

  const nextDeliveryMin =
    input.deliveryDaysMin !== undefined
      ? input.deliveryDaysMin
      : existingStore.deliveryDaysMin;

  const nextDeliveryMax =
    input.deliveryDaysMax !== undefined
      ? input.deliveryDaysMax
      : existingStore.deliveryDaysMax;

  if (nextDeliveryMin !== null && nextDeliveryMin <= 0) {
    throw new ApiError(
      400,
      "Minimum delivery days must be greater than 0",
      "INVALID_DELIVERY_DAYS",
    );
  }

  if (nextDeliveryMax !== null && nextDeliveryMax <= 0) {
    throw new ApiError(
      400,
      "Maximum delivery days must be greater than 0",
      "INVALID_DELIVERY_DAYS",
    );
  }

  if (
    nextDeliveryMin !== null &&
    nextDeliveryMax !== null &&
    nextDeliveryMax < nextDeliveryMin
  ) {
    throw new ApiError(
      400,
      "Maximum delivery days cannot be less than minimum delivery days",
      "INVALID_DELIVERY_RANGE",
    );
  }

  try {
    const updatedStore = await prisma.$transaction(async (tx) => {
      const store = await tx.store.update({
        where: {
          ownerId,
        },
        data: {
          ...(input.name !== undefined && {
            name: input.name,
          }),

          ...(input.slug !== undefined && {
            slug: input.slug,
          }),

          ...(input.handle !== undefined && {
            handle: input.handle,
          }),

          ...(input.tagline !== undefined && {
            tagline: input.tagline,
          }),

          ...(input.about !== undefined && {
            about: input.about,
          }),

          ...(input.logo !== undefined && {
            logo: input.logo,
          }),

          ...(input.coverImage !== undefined && {
            coverImage: input.coverImage,
          }),

          ...(input.email !== undefined && {
            email: input.email,
          }),

          ...(input.whatsapp !== undefined && {
            whatsapp: input.whatsapp,
          }),

          ...(input.location !== undefined && {
            location: input.location,
          }),

          ...(input.category !== undefined && {
            category: input.category,
          }),

          ...(input.deliveryDaysMin !== undefined && {
            deliveryDaysMin: input.deliveryDaysMin,
          }),

          ...(input.deliveryDaysMax !== undefined && {
            deliveryDaysMax: input.deliveryDaysMax,
          }),

          ...(input.socialLinks !== undefined && {
            socialLinks:
              input.socialLinks === null
                ? Prisma.DbNull
                : (input.socialLinks as Prisma.InputJsonValue),
          }),

          ...(input.policies !== undefined && {
            policies:
              input.policies === null
                ? Prisma.DbNull
                : (input.policies as Prisma.InputJsonValue),
          }),

          ...(input.isOpen !== undefined && {
            isOpen: input.isOpen,
          }),
        },
      });

      // Preserve the existing setup-completion behavior.
      // Suspended, closed and rejected stores are not
      // automatically reactivated by this logic.
      if (store.status === "PENDING" || store.status === "ACTIVE") {
        const setupComplete = isStoreSetupComplete({
          category: store.category,
          about: store.about,
          whatsapp: store.whatsapp,
          location: store.location,
          deliveryDaysMin: store.deliveryDaysMin,
          deliveryDaysMax: store.deliveryDaysMax,
        });

        if (setupComplete && store.status === "PENDING") {
          return tx.store.update({
            where: {
              id: store.id,
            },
            data: {
              status: "ACTIVE",
            },
          });
        }

        if (!setupComplete && store.status === "ACTIVE") {
          return tx.store.update({
            where: {
              id: store.id,
            },
            data: {
              status: "PENDING",
            },
          });
        }
      }

      return store;
    });

    const activeProductCount = await getActiveProductCount(updatedStore.id);

    return buildStoreResponse(updatedStore, activeProductCount);
  } catch (error) {
    throwStoreConflict(error);
  }
}

export async function getMyPayoutAccount(ownerId: string) {
  const store = await prisma.store.findUnique({
    where: {
      ownerId,
    },
    select: {
      id: true,
      bankDetails: true,
    },
  });

  if (!store) {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  const payoutAccount = maskPayoutAccount(store.bankDetails);

  if (!payoutAccount) {
    return {
      payoutSetupComplete: false,
      payoutAccount: null,
    };
  }

  return {
    payoutSetupComplete: true,
    payoutAccount,
  };
}

export async function updateMyPayoutAccount(
  ownerId: string,
  input: PayoutAccountInput,
) {
  const store = await prisma.store.findUnique({
    where: {
      ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!store) {
    throw new ApiError(404, "Store not found", "STORE_NOT_FOUND");
  }

  const bankCode = input.bankCode.trim();
  const bankName = input.bankName.trim();
  const accountName = input.accountName.trim();
  const accountNumber = input.accountNumber.trim();

  if (!bankCode) {
    throw new ApiError(400, "Bank code is required");
  }

  if (!bankName) {
    throw new ApiError(400, "Bank name is required");
  }

  if (!accountName) {
    throw new ApiError(400, "Account name is required");
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    throw new ApiError(400, "Account number must contain exactly 10 digits");
  }

  const bankDetails = {
    bankCode,
    bankName,
    accountName,
    accountNumber,
  };

  await prisma.store.update({
    where: {
      id: store.id,
    },
    data: {
      bankDetails: bankDetails as Prisma.InputJsonValue,
    },
  });

  return {
    payoutSetupComplete: true,
    payoutAccount: maskPayoutAccount(bankDetails),
  };
}
