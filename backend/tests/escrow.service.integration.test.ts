import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import {
  createEscrowForOrder,
  getEscrowByOrderId,
  requireEscrowForOrder,
} from "../src/services/escrow.service.js";
