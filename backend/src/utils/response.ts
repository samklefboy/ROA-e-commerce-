import type { Response } from "express";

export function successResponse<T>(res: Response, statusCode: number, data: T) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}
