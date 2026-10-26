import { prisma } from "../config/prisma.js";
import { getStateByCode, getZoneByStateCode } from "../config/location.js";
import { ApiError } from "../utils/api-error.js";

export type DeliveryQuoteInput = {
  userId: string;
  storeId: string;
  deliveryType: "DELIVERY" | "PICKUP";
  addressId?: string;
};

export type DeliveryQuote = {
  storeId: string;
  deliveryType: "DELIVERY" | "PICKUP";
  deliveryProvider: "SELLER" | null;
  deliveryFee: number;
  currency: string;

  ruleId: string | null;

  stateCode: string | null;
  zoneCode: string | null;

  estimatedDays: {
    min: number | null;
    max: number | null;
  } | null;

  pickup: {
    available: boolean;
    address: string | null;
    instructions: string | null;
  };
};

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function getBuyerAddress(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
    select: {
      id: true,
      stateCode: true,
      countryCode: true,
    },
  });

  if (!address) {
    throw new ApiError(400, "Selected delivery address was not found");
  }

  if (address.countryCode !== "NG") {
    throw new ApiError(
      400,
      "Currently, checkout is only available for Nigerian addresses",
    );
  }

  if (!address.stateCode || !getStateByCode(address.stateCode)) {
    throw new ApiError(
      400,
      "Selected address does not have a valid Nigerian state code",
    );
  }

  return address;
}

async function resolveDeliveryRule(storeId: string, stateCode: string) {
  const normalizedStateCode = stateCode.trim().toUpperCase();

  const zoneCode = getZoneByStateCode(normalizedStateCode);

  const rules = await prisma.deliveryRule.findMany({
    where: {
      storeId,
      isActive: true,
    },
    orderBy: [
      {
        priority: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const stateRule = rules.find(
    (rule) =>
      rule.scope === "STATE" &&
      rule.stateCode?.trim().toUpperCase() === normalizedStateCode,
  );

  if (stateRule) {
    return stateRule;
  }

  if (zoneCode) {
    const zoneRule = rules.find(
      (rule) =>
        rule.scope === "ZONE" &&
        rule.zoneCode?.trim().toUpperCase() === zoneCode.toUpperCase(),
    );

    if (zoneRule) {
      return zoneRule;
    }
  }

  return rules.find((rule) => rule.scope === "NATIONWIDE") ?? null;
}

export async function calculateDeliveryQuote(
  input: DeliveryQuoteInput,
): Promise<DeliveryQuote> {
  const store = await prisma.store.findUnique({
    where: {
      id: input.storeId,
    },
    select: {
      id: true,
      status: true,
      isOpen: true,

      pickupEnabled: true,
      pickupAddress: true,
      pickupInstructions: true,

      deliveryDaysMin: true,
      deliveryDaysMax: true,
    },
  });

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  if (store.status !== "ACTIVE") {
    throw new ApiError(400, "Store is not currently active");
  }

  if (!store.isOpen) {
    throw new ApiError(400, "Store is currently closed");
  }

  if (input.deliveryType === "PICKUP") {
    if (!store.pickupEnabled) {
      throw new ApiError(400, "Pickup is not available for this store");
    }

    if (!store.pickupAddress) {
      throw new ApiError(
        400,
        "Pickup location has not been configured by this store",
      );
    }

    return {
      storeId: store.id,

      deliveryType: "PICKUP",

      deliveryProvider: null,

      deliveryFee: 0,

      currency: "NGN",

      ruleId: null,

      stateCode: null,

      zoneCode: null,

      estimatedDays: null,

      pickup: {
        available: true,
        address: store.pickupAddress,
        instructions: store.pickupInstructions,
      },
    };
  }

  if (!input.addressId) {
    throw new ApiError(400, "Address is required for delivery");
  }

  const address = await getBuyerAddress(input.userId, input.addressId);

  const stateCode = address.stateCode!.trim().toUpperCase();

  const zoneCode = getZoneByStateCode(stateCode);

  if (!zoneCode) {
    throw new ApiError(400, "Unable to determine delivery zone");
  }

  const rule = await resolveDeliveryRule(store.id, stateCode);

  if (!rule) {
    const state = getStateByCode(stateCode);

    throw new ApiError(
      400,
      `Delivery is currently unavailable to ${
        state?.name ?? "your selected location"
      }`,
    );
  }

  return {
    storeId: store.id,

    deliveryType: "DELIVERY",

    deliveryProvider: "SELLER",

    deliveryFee: money(Number(rule.fee)),

    currency: rule.currency,

    ruleId: rule.id,

    stateCode,

    zoneCode,

    estimatedDays: {
      min: store.deliveryDaysMin,
      max: store.deliveryDaysMax,
    },

    pickup: {
      available: store.pickupEnabled,
      address: store.pickupAddress,
      instructions: store.pickupInstructions,
    },
  };
}
