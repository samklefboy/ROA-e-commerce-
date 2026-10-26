import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export type OtpVerifiedPayload = {
  sub: string;
  phone: string;
  type: "otp_verified";
};

export type LoginPayload = {
  sub: string;
  phone: string;
  type: "login";
};

export type AccessTokenPayload = {
  sub: string;
  phone: string;
  type: "access";
};

const OTP_TOKEN_EXPIRES_IN = "10m";

const ACCESS_TOKEN_EXPIRES_IN = "7d";

//Temporary token issued after successful OTP verification.
export function createOtpVerifiedToken(userId: string, phone: string): string {
  return jwt.sign(
    {
      sub: userId,
      phone,
      type: "otp_verified",
    },
    env.JWT_SECRET,
    {
      expiresIn: OTP_TOKEN_EXPIRES_IN,
    },
  );
}

export function createAccessToken(userId: string, phone: string): string {
  return jwt.sign(
    {
      sub: userId,
      phone,
      type: "access",
    },
    env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  );
}

export function createLoginToken(userId: string, phone: string): string {
  return createAccessToken(userId, phone);
}

// Verify a JWT token.
export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
}

//Generate a cryptographically secure refresh token.
export function createRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

// Hash a refresh token before storing/comparing it.
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
