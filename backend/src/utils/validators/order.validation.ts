import { z } from "zod";

const deliverySelectionSchema = z.object({
  type: z.enum(["DELIVERY", "PICKUP"]),
});

const createOrderFields = {
  cartId: z.string().min(1),
  itemIds: z.array(z.string().min(1)).min(1, "Select at least one cart item"),

  delivery: z
    .record(z.string().min(1), deliverySelectionSchema)
    .refine(
      (value) => Object.keys(value).length > 0,
      "Delivery selection is required",
    ),

  addressId: z.string().min(1).optional(),

  paymentMethod: z.enum(["WALLET"]),

  deliveryNote: z
    .string()
    .trim()
    .max(500, "Delivery note cannot exceed 500 characters")
    .optional(),
};

export const createOrderSchema = z
  .object(createOrderFields)
  .superRefine((data, ctx) => {
    const hasDelivery = Object.values(data.delivery).some(
      (selection) => selection.type === "DELIVERY",
    );

    if (hasDelivery && !data.addressId) {
      ctx.addIssue({
        code: "custom",
        path: ["addressId"],
        message: "A delivery address is required",
      });
    }
  });

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Cancellation reason cannot exceed 500 characters")
    .optional(),
});

export const orderListQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "IN_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ])
    .optional(),

  search: z.string().trim().max(100).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
