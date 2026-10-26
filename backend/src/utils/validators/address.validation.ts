import { z } from "zod";
import { getStateByCode, NIGERIA_STATES } from "../../config/location.js";

const stateCodes = NIGERIA_STATES.map((state) => state.code) as [
  string,
  ...string[],
];

const addressFields = {
  recipientName: z.string().trim().min(2).max(100),

  phone: z.string().trim().min(7).max(20),

  addressLine1: z.string().trim().min(3).max(200),

  addressLine2: z.string().trim().max(200).optional(),

  city: z.string().trim().min(2).max(100),

  stateCode: z.enum(stateCodes).nullable().optional(),

  countryCode: z.string().trim().length(2).default("NG"),

  landmark: z.string().trim().max(200).optional(),

  isDefault: z.boolean().optional().default(false),
};

export const addressIdSchema = z.object({
  id: z.string().min(1),
});

export const createAddressSchema = z
  .object(addressFields)
  .superRefine((data, ctx) => {
    if (!data.stateCode) return;

    const state = getStateByCode(data.stateCode);

    if (!state) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stateCode"],
        message: "Invalid Nigerian state code",
      });
    }
  });

export const updateAddressSchema = z.object(addressFields).partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
