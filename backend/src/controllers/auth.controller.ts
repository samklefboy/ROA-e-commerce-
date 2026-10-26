import type { RequestHandler } from "express";
import * as authService from "../services/auth.service.js";
import { successResponse } from "../utils/response.js";

const REFRESH_COOKIE_NAME = "roa_refresh";
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? ("none" as const)
      : ("lax" as const),
  path: "/api/v1/auth",
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

function setRefreshCookie(
  res: Parameters<RequestHandler>[1],
  refreshToken: string,
) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

function clearRefreshCookie(res: Parameters<RequestHandler>[1]) {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(req.body.phone);

    return successResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body.phone, req.body.otp);

    return successResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const createPassword: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.createPassword(
      req.body.token,
      req.body.password,
    );

    setRefreshCookie(res, result.refreshToken);

    return successResponse(res, 201, {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.phone, req.body.password);

    setRefreshCookie(res, result.refreshToken);

    return successResponse(res, 200, {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    const result = await authService.refresh(refreshToken);

    setRefreshCookie(res, result.refreshToken);

    return successResponse(res, 200, {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await authService.logout(refreshToken);

    clearRefreshCookie(res);

    return successResponse(res, 200, {
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll: RequestHandler = async (req, res, next) => {
  try {
    await authService.logoutAll(req.authUser.id);

    clearRefreshCookie(res);

    return successResponse(res, 200, {
      message: "All sessions logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
