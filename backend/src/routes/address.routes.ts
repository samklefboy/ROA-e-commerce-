import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  create,
  getAddress,
  getAddresses,
  remove,
  setDefault,
  update,
} from "../controllers/address.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getAddresses);

router.get("/:id", getAddress);

router.post("/", create);

router.patch("/:id", update);

router.patch("/:id/default", setDefault);

router.delete("/:id", remove);

export default router;
