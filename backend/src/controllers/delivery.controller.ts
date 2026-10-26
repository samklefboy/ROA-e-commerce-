import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { calculateDeliveryQuote } from "../services/delivery.service.js";
import { ApiError } from "../utils/api-error.js";
import {
  createDeliveryRuleSchema,
  deliveryQuoteSchema,
  updateDeliveryRuleSchema,
  updatePickupSettingsSchema,
} from "../utils/validators/delivery.validator.js";

function getParam(value: string | string[] | undefined, name: string) {
  if (typeof value !== "string" || !value) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
}

type AuthenticatedRequest = Request & {
  authUser?: {
    id: string;
    phone: string;
  };
};

function requireAuthUser(req: AuthenticatedRequest) {
  if (!req.authUser) {
    throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
  }

  return req.authUser;
}

async function getOwnedStore(ownerId: string) {
  const store = await prisma.store.findUnique({
    where: {
      ownerId,
    },
  });

  if (!store) {
    throw new ApiError(404, "You do not have a store");
  }

  return store;
}

export async function calculateDeliveryQuoteController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const user = requireAuthUser(req);

  const body = deliveryQuoteSchema.parse(req.body);

  const quote = await calculateDeliveryQuote({
    userId: user.id,
    storeId: body.storeId,
    deliveryType: body.deliveryType,
    ...(body.addressId ? { addressId: body.addressId } : {}),
  });

  return res.status(200).json({
    success: true,
    data: quote,
  });
}

export async function getDeliveryRulesController(req: Request, res: Response) {
  const storeId = getParam(req.params.storeId, "storeId");

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

  return res.status(200).json({
    success: true,
    data: rules,
  });
}

export async function createDeliveryRuleController(
  req: Request,
  res: Response,
) {
  const input = createDeliveryRuleSchema.parse(req.body);

  const store = await getOwnedStore(req.authUser.id);

  if (store.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "Your store must be active before configuring delivery",
    );
  }

  const rule = await prisma.deliveryRule.create({
    data: {
      storeId: store.id,
      scope: input.scope,
      stateCode: input.stateCode ?? null,
      zoneCode: input.zoneCode ?? null,
      fee: input.fee,
      currency: input.currency ?? "NGN",
      priority: input.priority ?? 0,
      isActive: input.isActive ?? true,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Delivery rule created successfully",
    data: rule,
  });
}

export async function updateDeliveryRuleController(
  req: Request,
  res: Response,
) {
  const id = getParam(req.params.id, "id");

  const input = updateDeliveryRuleSchema.parse(req.body);

  const store = await getOwnedStore(req.authUser.id);

  const existing = await prisma.deliveryRule.findFirst({
    where: {
      id,
      storeId: store.id,
    },
  });

  if (!existing) {
    throw new ApiError(404, "Delivery rule not found");
  }

  const rule = await prisma.deliveryRule.update({
    where: {
      id,
    },

    data: {
      ...(input.scope !== undefined && {
        scope: input.scope,
      }),

      ...(input.stateCode !== undefined && {
        stateCode: input.stateCode,
      }),

      ...(input.zoneCode !== undefined && {
        zoneCode: input.zoneCode,
      }),

      ...(input.fee !== undefined && {
        fee: input.fee,
      }),

      ...(input.currency !== undefined && {
        currency: input.currency,
      }),

      ...(input.priority !== undefined && {
        priority: input.priority,
      }),

      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),
    },
  });

  return res.status(200).json({
    success: true,
    message: "Delivery rule updated successfully",
    data: rule,
  });
}

export async function deleteDeliveryRuleController(
  req: Request,
  res: Response,
) {
  const id = getParam(req.params.id, "id");

  const store = await getOwnedStore(req.authUser.id);

  const existing = await prisma.deliveryRule.findFirst({
    where: {
      id,
      storeId: store.id,
    },
  });

  if (!existing) {
    throw new ApiError(404, "Delivery rule not found");
  }

  await prisma.deliveryRule.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Delivery rule disabled successfully",
  });
}

export async function updatePickupSettingsController(
  req: Request,
  res: Response,
) {
  const input = updatePickupSettingsSchema.parse(req.body);

  const store = await getOwnedStore(req.authUser.id);

  if (input.pickupEnabled && !input.pickupAddress) {
    throw new ApiError(
      400,
      "Pickup address is required when pickup is enabled",
    );
  }

  const storeUpdated = await prisma.store.update({
    where: {
      id: store.id,
    },
    data: {
      pickupEnabled: input.pickupEnabled,
      pickupAddress:
        input.pickupAddress !== undefined ? input.pickupAddress : null,
      pickupInstructions:
        input.pickupInstructions !== undefined
          ? input.pickupInstructions
          : null,
    },
    select: {
      id: true,
      pickupEnabled: true,
      pickupAddress: true,
      pickupInstructions: true,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Pickup settings updated successfully",
    data: storeUpdated,
  });
}
