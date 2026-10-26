import { z } from "zod";

const deliveryRuleFields = {
  scope: z.enum(["STATE", "ZONE", "NATIONWIDE"]),

  stateCode: z.string().optional(),

  zoneCode: z.string().optional(),

  fee: z.number().min(0),

  currency: z.string().length(3).optional(),

  priority: z.number().int().min(0).optional(),

  isActive: z.boolean().optional(),
};

export const deliveryQuoteSchema = z.object({
  storeId: z.string().min(1),
  deliveryType: z.enum(["DELIVERY", "PICKUP"]),
  addressId: z.string().min(1).optional(),
  stateCode: z.string().optional(),
});

export const createDeliveryRuleSchema = z
  .object(deliveryRuleFields)
  .superRefine((data, ctx) => {
    if (data.scope === "STATE" && !data.stateCode) {
      ctx.addIssue({
        code: "custom",
        path: ["stateCode"],
        message: "stateCode is required for STATE rules",
      });
    }

    if (data.scope === "ZONE" && !data.zoneCode) {
      ctx.addIssue({
        code: "custom",
        path: ["zoneCode"],
        message: "zoneCode is required for ZONE rules",
      });
    }

    if (data.scope === "NATIONWIDE" && (data.stateCode || data.zoneCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["scope"],
        message: "NATIONWIDE rules cannot contain stateCode or zoneCode",
      });
    }
  });

export const updateDeliveryRuleSchema = z.object(deliveryRuleFields).partial();

export const updatePickupSettingsSchema = z.object({
  pickupEnabled: z.boolean(),
  pickupAddress: z.string().max(500).nullable().optional(),
  pickupInstructions: z.string().max(1000).nullable().optional(),
});
