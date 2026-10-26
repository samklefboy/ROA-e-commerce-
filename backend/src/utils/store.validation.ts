import { z } from "zod";

const storeCategorySchema = z.enum([
  "GENERAL",
  "FASHION",
  "ELECTRONICS",
  "SPORTS",
  "BEAUTY",
  "HOME",
  "AUTOMOTIVE",
  "FOOD",
  "SERVICES",
  "EDUCATION",
  "HEALTH",
  "TRAVEL",
  "ENTERTAINMENT",
  "ART",
  "AGRICULTURE",
  "MUSIC",
  "REAL_ESTATE",
  "OTHER",
]);

const slugSchema = z
  .string()
  .trim()
  .min(2, "Store slug is required")
  .max(100, "Store slug must not exceed 100 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers, and hyphens only",
  );

const handleSchema = z
  .string()
  .trim()
  .regex(
    /^@[A-Za-z0-9._-]+$/,
    "Handle must start with @ and contain valid characters",
  )
  .nullable()
  .optional();

const socialLinksSchema = z
  .record(z.string(), z.string())
  .nullable()
  .optional();

const policiesSchema = z
  .array(
    z.object({
      label: z
        .string()
        .trim()
        .min(1, "Policy label is required")
        .max(100, "Policy label is too long"),
      value: z
        .string()
        .trim()
        .min(1, "Policy value is required")
        .max(500, "Policy value is too long"),
    }),
  )
  .nullable()
  .optional();

const promotionDateSchema = z.preprocess(
  (value) => (value === null ? null : value),
  z.coerce.date().nullable().optional(),
);

const promotionUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "URL must use HTTP or HTTPS");

export const createPromotionSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().max(2000).nullable().optional(),
    imageUrl: promotionUrlSchema.nullable().optional(),
    ctaLabel: z.string().trim().min(1).max(40).nullable().optional(),
    ctaUrl: promotionUrlSchema.nullable().optional(),
    startsAt: promotionDateSchema,
    endsAt: promotionDateSchema,
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date must be later than start date",
      });
    }

    if (Boolean(data.ctaLabel?.trim()) !== Boolean(data.ctaUrl?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ctaUrl"],
        message: "CTA label and URL must be provided together",
      });
    }
  });

export const updatePromotionSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    message: z.string().trim().max(2000).nullable().optional(),
    imageUrl: promotionUrlSchema.nullable().optional(),
    ctaLabel: z.string().trim().min(1).max(40).nullable().optional(),
    ctaUrl: promotionUrlSchema.nullable().optional(),
    startsAt: promotionDateSchema,
    endsAt: promotionDateSchema,
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date must be later than start date",
      });
    }

    if (
      data.ctaLabel !== undefined &&
      data.ctaUrl !== undefined &&
      Boolean(data.ctaLabel?.trim()) !== Boolean(data.ctaUrl?.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ctaUrl"],
        message: "CTA label and URL must be provided together",
      });
    }
  });

export const createStoreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must not exceed 100 characters"),

  slug: slugSchema,

  handle: handleSchema,

  tagline: z
    .string()
    .trim()
    .max(200, "Tagline must not exceed 200 characters")
    .nullable()
    .optional(),

  about: z
    .string()
    .trim()
    .max(5000, "About must not exceed 5000 characters")
    .nullable()
    .optional(),

  logo: z.string().trim().url("Logo must be a valid URL").nullable().optional(),

  coverImage: z
    .string()
    .trim()
    .url("Cover image must be a valid URL")
    .nullable()
    .optional(),
});

export const updateStoreSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Store name must be at least 2 characters")
      .max(100, "Store name must not exceed 100 characters")
      .optional(),

    slug: slugSchema.optional(),

    handle: handleSchema,

    tagline: z
      .string()
      .trim()
      .max(200, "Tagline must not exceed 200 characters")
      .nullable()
      .optional(),

    about: z
      .string()
      .trim()
      .max(5000, "About must not exceed 5000 characters")
      .nullable()
      .optional(),

    logo: z
      .string()
      .trim()
      .url("Logo must be a valid URL")
      .nullable()
      .optional(),

    coverImage: z
      .string()
      .trim()
      .url("Cover image must be a valid URL")
      .nullable()
      .optional(),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .nullable()
      .optional(),

    whatsapp: z
      .string()
      .trim()
      .min(10, "Invalid WhatsApp number")
      .max(20, "Invalid WhatsApp number")
      .nullable()
      .optional(),

    location: z
      .string()
      .trim()
      .max(200, "Location must not exceed 200 characters")
      .nullable()
      .optional(),

    // PATCH requests may change either value independently.
    deliveryDaysMin: z.number().int().positive().nullable().optional(),

    deliveryDaysMax: z.number().int().positive().nullable().optional(),

    category: storeCategorySchema.optional(),

    socialLinks: socialLinksSchema,

    policies: policiesSchema,

    isOpen: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one store field is required",
  });

export const payoutAccountSchema = z.object({
  bankCode: z
    .string()
    .trim()
    .min(1, "Bank code is required")
    .max(50, "Bank code is too long"),

  bankName: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(100, "Bank name is too long"),

  accountName: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(150, "Account name is too long"),

  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Account number must contain exactly 10 digits"),
});
