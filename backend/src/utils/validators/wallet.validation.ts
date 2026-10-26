import { z } from "zod";

export const walletIdSchema = z.object({
  id: z.string().min(1),
});

export const walletTransactionSchema = z.object({
  amount: z.number().positive().finite(),
  idempotencyKey: z.string().trim().min(10).max(100),
  description: z.string().trim().max(255).optional(),
});

export type WalletTransactionInput = z.infer<typeof walletTransactionSchema>;
