import { z } from "zod";

export const openDisputeSchema = z
  .object({
    reason: z.enum([
      "WRONG_ITEM",
      "DAMAGED",
      "DEFECTIVE",
      "NOT_AS_DESCRIBED",
      "MISSING_ITEM",
      "QUALITY_ISSUE",
      "DELIVERY_ISSUE",
      "OTHER",
    ]),
    description: z
      .string()
      .trim()
      .min(10, "Please describe the issue in at least 10 characters")
      .max(5000, "Description cannot exceed 5000 characters"),
    evidence: z
      .array(z.string().url("Each evidence item must be a valid URL"))
      .max(10, "You can submit at most 10 evidence URLs")
      .optional(),
  })
  .strict();
