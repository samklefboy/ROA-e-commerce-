import { z } from "zod";

const deliveryTypeSchema = z.enum(["DELIVERY", "PICKUP"]);

const paymentMethodSchema = z.enum(["WALLET", "CARD", "TRANSFER"]);

const deliverySelectionSchema = z.object({
  type: deliveryTypeSchema,
});

export const deliveryQuoteSchema = z.object({
  storeId: z.string().min(1),

  type: deliveryTypeSchema,

  addressId: z.string().min(1).optional(),
});

export const checkoutSchema = z.object({
  cartId: z.string().min(1),

  itemIds: z.array(z.string().min(1)).min(1),

  addressId: z.string().min(1).optional(),

  delivery: z.record(z.string(), deliverySelectionSchema),

  paymentMethod: paymentMethodSchema,

  deliveryNote: z.string().trim().max(500).optional(),

  promoCode: z.string().trim().max(50).optional(),
});

export type DeliveryQuoteInput = z.infer<typeof deliveryQuoteSchema>;

export type CheckoutInput = z.infer<typeof checkoutSchema>;
