import type { Request, Response } from "express";
import {
  getDeliveryQuote,
  previewCheckout,
} from "../services/checkout.service.js";
import {
  checkoutSchema,
  deliveryQuoteSchema,
} from "../utils/validators/checkout.validation.js";
import { successResponse } from "../utils/response.js";

export async function deliveryQuote(req: Request, res: Response) {
  const input = deliveryQuoteSchema.parse(req.body);

  const quote = await getDeliveryQuote(req.authUser.id, input);

  return successResponse(res, 200, {
    message: "Delivery quote calculated successfully",
    quote,
  });
}

export async function preview(req: Request, res: Response) {
  const input = checkoutSchema.parse(req.body);

  const checkout = await previewCheckout(req.authUser.id, input);

  return successResponse(res, 200, {
    message: "Checkout preview calculated successfully",
    checkout,
  });
}
