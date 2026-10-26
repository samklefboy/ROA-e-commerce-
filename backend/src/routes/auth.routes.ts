import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  register,
  createPassword,
  login,
  verifyOtp,
  refresh,
  logout,
  logoutAll,
} from "../controllers/auth.controller.js";

import { otpRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";

const router = Router();

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number is required")
    .max(15, "Invalid phone number"),
});

const otpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number is required")
    .max(15, "Invalid phone number"),

  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const createPasswordSchema = z.object({
  token: z.string().min(1, "Registration token is required"),

  password: z
    .string()
    .min(8, "Password must be more than 8 characters")
    .max(72, "Password must not exceed 72 characters"),
});

const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number is required")
    .max(15, "Invalid phone number"),

  password: z.string().min(1, "Password is required"),
});

router.post("/register", otpRateLimiter, validateBody(phoneSchema), register);

router.post("/verify-otp", validateBody(otpSchema), verifyOtp);

router.post(
  "/create-password",
  validateBody(createPasswordSchema),
  createPassword,
);

router.post("/login", validateBody(loginSchema), login);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.post("/logout-all", authMiddleware, logoutAll);

export default router;
