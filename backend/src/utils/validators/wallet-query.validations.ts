import { z } from "zod";

const optionalBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const optionalDate = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.date().optional(),
);

export const walletSummaryQuerySchema = z
  .object({
    dateFrom: optionalDate,
    dateTo: optionalDate,
  })
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    {
      message: "dateFrom must be earlier than or equal to dateTo.",
      path: ["dateTo"],
    },
  );

export const walletTransactionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),

    type: z
      .enum(["TOPUP", "SALE", "REFUND", "PURCHASE", "WITHDRAWAL"])
      .optional(),

    credit: optionalBoolean,
    debit: optionalBoolean,

    status: z.enum(["PENDING", "COMPLETED", "FAILED", "REVERSED"]).optional(),

    search: z.string().trim().max(100).optional(),
    dateFrom: optionalDate,
    dateTo: optionalDate,
  })
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    {
      message: "dateFrom must be earlier than or equal to dateTo.",
      path: ["dateTo"],
    },
  )
  .refine((value) => !(value.credit && value.debit), {
    message: "Choose either credit or debit, not both.",
    path: ["debit"],
  });

export type WalletTransactionsQuery = z.infer<
  typeof walletTransactionsQuerySchema
>;
