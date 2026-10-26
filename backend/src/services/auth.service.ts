import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { createWalletForUser } from "./wallet/wallet.service.js";
import {
  createAccessToken,
  createOtpVerifiedToken,
  verifyToken,
} from "../utils/jwt.js";
import {
  createRefreshSession,
  revokeAllUserSessions,
  revokeRefreshSession,
  rotateRefreshSession,
} from "./refresh-session.service.js";
import { generateOtp, getOtpExpiry } from "../utils/otp.js";
import { normalizePhone } from "../utils/phone.js";
import { sendOTP } from "./termii.service.js";

const BCRYPT_ROUNDS = 10;

function sanitizeUser(user: {
  id: string;
  phone: string;
  password?: string | null;
  isVerified: boolean;
  hasStore: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    phone: user.phone,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    hasStore: user.hasStore,
  };
}

export async function register(rawPhone: string) {
  const phone = normalizePhone(rawPhone);

  const existingUser = await prisma.user.findUnique({
    where: {
      phone,
    },
  });

  if (!existingUser) {
    const otp = generateOtp();
    const otpExpiresAt = getOtpExpiry();

    const user = await prisma.user.create({
      data: {
        phone,
        otp,
        otpExpiresAt,
        isVerified: false,
      },
    });

    try {
      await sendOTP(phone, otp);
    } catch (error) {
      await prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      throw error;
    }

    return {
      exists: false,
      message: "OTP sent",
    };
  }

  if (existingUser.isVerified) {
    return {
      exists: true,
      requiresPassword: true,
    };
  }

  const otp = generateOtp();
  const otpExpiresAt = getOtpExpiry();

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      otp,
      otpExpiresAt,
    },
  });

  try {
    await sendOTP(phone, otp);
  } catch (error) {
    throw error;
  }

  return {
    exists: false,
    message: "OTP sent",
  };
}

export async function verifyOtp(rawPhone: string, otp: string) {
  const phone = normalizePhone(rawPhone);

  const user = await prisma.user.findUnique({
    where: {
      phone,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (user.isVerified) {
    throw new ApiError(
      400,
      "Phone number is already verified",
      "ALREADY_VERIFIED",
    );
  }

  if (!user.otp || !user.otpExpiresAt) {
    throw new ApiError(400, "No active OTP found", "OTP_NOT_FOUND");
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "OTP has expired", "OTP_EXPIRED");
  }

  if (user.otp !== otp) {
    throw new ApiError(400, "Invalid OTP", "INVALID_OTP");
  }

  const token = createOtpVerifiedToken(user.id, user.phone);

  return {
    verified: true,
    token,
  };
}

export async function createPassword(token: string, password: string) {
  let payload;

  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(
      401,
      "Invalid or expired registration token",
      "INVALID_OTP_TOKEN",
    );
  }

  if (payload.type !== "otp_verified") {
    throw new ApiError(401, "Invalid registration token", "INVALID_TOKEN_TYPE");
  }

  if (typeof payload.sub !== "string" || typeof payload.phone !== "string") {
    throw new ApiError(401, "Invalid registration token", "INVALID_TOKEN");
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.update({
    where: {
      id: payload.sub,
    },
    data: {
      password: hashedPassword,
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    },
  });

  await createWalletForUser(user.id);

  const accessToken = createAccessToken(user.id, user.phone);

  const refreshSession = await createRefreshSession(user.id);

  return {
    accessToken,
    refreshToken: refreshSession.refreshToken,
    refreshExpiresAt: refreshSession.expiresAt,
    user: sanitizeUser(user),
  };
}

export async function login(rawPhone: string, password: string) {
  const phone = normalizePhone(rawPhone);

  const user = await prisma.user.findUnique({
    where: {
      phone,
    },
  });

  if (!user || !user.isVerified || !user.password) {
    throw new ApiError(
      401,
      "Invalid phone number or password",
      "INVALID_CREDENTIALS",
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(
      401,
      "Invalid phone number or password",
      "INVALID_CREDENTIALS",
    );
  }

  const accessToken = createAccessToken(user.id, user.phone);

  const refreshSession = await createRefreshSession(user.id);

  return {
    accessToken,
    refreshToken: refreshSession.refreshToken,
    refreshExpiresAt: refreshSession.expiresAt,
    user: sanitizeUser(user),
  };
}

export async function refresh(refreshToken: string) {
  if (!refreshToken) {
    throw new ApiError(
      401,
      "Refresh token is required",
      "REFRESH_TOKEN_REQUIRED",
    );
  }

  const rotatedSession = await rotateRefreshSession(refreshToken);

  const user = await prisma.user.findUnique({
    where: {
      id: rotatedSession.userId,
    },
  });

  if (!user || !user.isVerified) {
    throw new ApiError(
      401,
      "User account is no longer available",
      "USER_NOT_AVAILABLE",
    );
  }

  const accessToken = createAccessToken(user.id, user.phone);

  return {
    accessToken,
    refreshToken: rotatedSession.refreshToken,
    refreshExpiresAt: rotatedSession.expiresAt,
    user: sanitizeUser(user),
  };
}

export async function logout(refreshToken: string) {
  await revokeRefreshSession(refreshToken);

  return {
    loggedOut: true,
  };
}

export async function logoutAll(userId: string) {
  await revokeAllUserSessions(userId);

  return {
    loggedOut: true,
    allSessionsRevoked: true,
  };
}
