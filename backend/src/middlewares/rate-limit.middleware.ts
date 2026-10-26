import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,

  limit: 3,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  message: {
    success: false,
    error: {
      code: "OTP_RATE_LIMIT",
      message: "Too many OTP requests. Please try again later.",
    },
  },
});
