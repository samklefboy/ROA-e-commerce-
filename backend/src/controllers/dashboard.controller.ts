import type { RequestHandler } from "express";
import { getStoreDashboardOverview } from "../services/dashboard.service.js";
import type { DashboardPeriod } from "../services/dashboard.service.js";
import { ApiError } from "../utils/api-error.js";
import { successResponse } from "../utils/response.js";

const allowedPeriods: DashboardPeriod[] = ["7d", "30d", "12m"];

export const getStoreDashboardOverviewController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const requestedPeriod = req.query.period;

    if (
      requestedPeriod !== undefined &&
      (typeof requestedPeriod !== "string" ||
        !allowedPeriods.includes(requestedPeriod as DashboardPeriod))
    ) {
      throw new ApiError(
        400,
        "Invalid dashboard period. Use 7d, 30d, or 12m.",
        "INVALID_DASHBOARD_PERIOD",
      );
    }

    const period = (
      typeof requestedPeriod === "string" ? requestedPeriod : "7d"
    ) as DashboardPeriod;

    const dashboard = await getStoreDashboardOverview(req.authUser.id, period);

    return successResponse(res, 200, dashboard);
  } catch (error) {
    return next(error);
  }
};
