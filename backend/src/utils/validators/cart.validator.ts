import { z } from "zod";

const variantSchema = z.record(z.string().min(1), z.string().min(1));

export const addToCartSchema = z.object({
  productId: z.string().min(1),

  quantity: z.number().int().min(1).max(100),

  variant: variantSchema.nullable().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(100),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
