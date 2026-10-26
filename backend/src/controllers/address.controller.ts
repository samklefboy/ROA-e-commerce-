import type { Request, Response } from "express";
import {
  createAddress,
  deleteAddress,
  getAddressById,
  getUserAddresses,
  setDefaultAddress,
  updateAddress,
} from "../services/address.service.js";
import {
  addressIdSchema,
  createAddressSchema,
  updateAddressSchema,
} from "../utils/validators/address.validation.js";
import { successResponse } from "../utils/response.js";

export async function getAddresses(req: Request, res: Response) {
  const addresses = await getUserAddresses(req.authUser.id);

  return successResponse(res, 200, {
    message: "Addresses retrieved successfully",
    addresses,
  });
}

export async function getAddress(req: Request, res: Response) {
  const { id } = addressIdSchema.parse(req.params);

  const address = await getAddressById(req.authUser.id, id);

  return successResponse(res, 200, {
    message: "Address retrieved successfully",
    address,
  });
}

export async function create(req: Request, res: Response) {
  const input = createAddressSchema.parse(req.body);

  const address = await createAddress(req.authUser.id, input);

  return successResponse(res, 201, {
    message: "Address created successfully",
    address,
  });
}

export async function update(req: Request, res: Response) {
  const { id } = addressIdSchema.parse(req.params);

  const input = updateAddressSchema.parse(req.body);

  const address = await updateAddress(req.authUser.id, id, input);

  return successResponse(res, 200, {
    message: "Address updated successfully",
    address,
  });
}

export async function setDefault(req: Request, res: Response) {
  const { id } = addressIdSchema.parse(req.params);

  const address = await setDefaultAddress(req.authUser.id, id);

  return successResponse(res, 200, {
    message: "Default address updated successfully",
    address,
  });
}

export async function remove(req: Request, res: Response) {
  const { id } = addressIdSchema.parse(req.params);

  const result = await deleteAddress(req.authUser.id, id);

  return successResponse(res, 200, {
    message: result.message,
  });
}
