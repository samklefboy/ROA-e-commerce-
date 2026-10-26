import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { createRefreshToken, hashRefreshToken } from "../utils/jwt.js";

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;
//Calculate the expiry date for a new refresh session.
function getRefreshTokenExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
  return expiresAt;
}

/* Create a refresh session for a user. The raw refresh token is returned to the caller, but only its SHA-256 hash is stored in the database. */
export async function createRefreshSession(userId: string) {
  const refreshToken = createRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();
  const session = await prisma.refreshSession.create({
    data: { userId, tokenHash, expiresAt },
  });
  return { sessionId: session.id, refreshToken, expiresAt: session.expiresAt };
}

/* Find a valid refresh session using the raw refresh token. */
export async function findValidRefreshSession(refreshToken: string) {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
  });
  if (!session) {
    throw new ApiError(401, "Invalid refresh token");
  }
  if (session.revokedAt) {
    throw new ApiError(401, "Refresh session has been revoked");
  }
  if (session.expiresAt <= new Date()) {
    throw new ApiError(401, "Refresh session has expired");
  }
  return session;
}

/* Rotate a refresh session. The old refresh token is revoked and a new refresh token is created for the same user. */
export async function rotateRefreshSession(refreshToken: string) {
  if (!refreshToken) {
    throw new ApiError(
      401,
      "Refresh token is required",
      "REFRESH_TOKEN_REQUIRED",
    );
  }
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
  });
  if (!session) {
    throw new ApiError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }
  // A previously rotated token is being reused, revoke every active session belonging to this user.
  if (session.revokedAt) {
    await revokeAllUserSessions(session.userId);
    throw new ApiError(
      401,
      "Refresh token reuse detected",
      "REFRESH_TOKEN_REUSE",
    );
  }
  if (session.expiresAt <= new Date()) {
    throw new ApiError(
      401,
      "Refresh session has expired",
      "REFRESH_TOKEN_EXPIRED",
    );
  }
  const newRefreshToken = createRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = getRefreshTokenExpiry();
  const result = await prisma.$transaction(async (tx) => {
    // Atomically revoke the current session.
    const revoked = await tx.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    //Protect against two simultaneous refresh requests using the same refresh token.
    if (revoked.count !== 1) {
      throw new ApiError(
        401,
        "Refresh token reuse detected",
        "REFRESH_TOKEN_REUSE",
      );
    }
    const newSession = await tx.refreshSession.create({
      data: {
        userId: session.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    });
    return newSession;
  });
  return {
    userId: session.userId,
    sessionId: result.id,
    refreshToken: newRefreshToken,
    expiresAt: result.expiresAt,
  };
}

/* Revoke one refresh session.Used during logout. */
export async function revokeRefreshSession(refreshToken: string) {
  if (!refreshToken) {
    return;
  }
  const tokenHash = hashRefreshToken(refreshToken);
  await prisma.refreshSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Revoke all refresh sessions belonging to a user.
export async function revokeAllUserSessions(userId: string) {
  await prisma.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
