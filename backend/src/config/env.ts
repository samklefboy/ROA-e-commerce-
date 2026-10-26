/*import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),

  TERMII_API_KEY: z.string().min(1, "TERMII_API_KEY is required"),

  TERMII_SENDER_ID: z.string().min(1, "TERMII_SENDER_ID is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");

  console.error(
    parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );

  process.exit(1);
}

export const env = parsed.data; */

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),

  TERMII_API_KEY: z.string().min(1, "TERMII_API_KEY is required").optional(),

  TERMII_SENDER_ID: z
    .string()
    .min(1, "TERMII_SENDER_ID is required")
    .optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");

  console.error(
    parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );

  process.exit(1);
}

export const env = parsed.data;
