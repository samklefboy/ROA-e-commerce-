import { z } from "zod";

export const productTypeSchema = z.enum(["REGULAR", "CAR", "REALESTATE"]);

export const productConditionSchema = z.enum([
  "BRAND_NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
  "USED",
]);

export const productStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
  "HIDDEN",
]);

export const productVariantSchema = z.object({
  combination: z.record(z.string(), z.string()),
  price: z.number().finite().positive(),
  stock: z.number().int().min(0),
  sku: z.string().trim().min(1).max(100),
});

const productBaseSchema = z.object({
  type: productTypeSchema.optional(),

  name: z.string().trim().min(2).max(200),

  description: z.string().trim().min(10),

  images: z.array(z.string().url()).min(1),

  categoryId: z.string().trim().min(1).nullable().optional(),

  price: z.number().finite().positive(),

  costPrice: z.number().finite().min(0).nullable().optional(),

  condition: productConditionSchema.optional(),

  status: productStatusSchema.optional(),

  stock: z.number().int().min(0).nullable().optional(),

  keywords: z.array(z.string().trim().min(1)).nullable().optional(),

  hasVariants: z.boolean().optional(),

  variants: z
    .record(z.string(), z.array(z.string().trim().min(1)))
    .nullable()
    .optional(),

  productVariants: z.array(productVariantSchema).optional(),

  location: z.string().trim().max(200).nullable().optional(),

  listingMeta: z.unknown().optional(),
});

function validateProductVariants(
  data: {
    hasVariants?: boolean | undefined;
    variants?: Record<string, string[]> | null | undefined;
    productVariants?: z.infer<typeof productVariantSchema>[] | undefined;
  },
  ctx: z.RefinementCtx,
) {
  if (data.hasVariants === true) {
    if (!data.variants || Object.keys(data.variants).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Variant options are required when variants are enabled.",
      });
    }

    if (!data.productVariants?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["productVariants"],
        message: "At least one product variant is required.",
      });
    }
  }

  if (data.hasVariants === false && data.productVariants?.length) {
    ctx.addIssue({
      code: "custom",
      path: ["productVariants"],
      message:
        "Product variants cannot be supplied when variants are disabled.",
    });
  }

  if (data.productVariants?.length) {
    const seenSkus = new Set<string>();

    for (const [index, variant] of data.productVariants.entries()) {
      const normalizedSku = variant.sku.trim().toLowerCase();

      if (seenSkus.has(normalizedSku)) {
        ctx.addIssue({
          code: "custom",
          path: ["productVariants", index, "sku"],
          message: "Each product variant must have a unique SKU.",
        });
      }

      seenSkus.add(normalizedSku);

      if (Object.keys(variant.combination).length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["productVariants", index, "combination"],
          message: "Each variant must specify its option combination.",
        });
      }
    }
  }
}

export const createProductSchema = productBaseSchema.superRefine(
  validateProductVariants,
);

export const updateProductSchema = productBaseSchema
  .partial()
  .superRefine(validateProductVariants);

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
