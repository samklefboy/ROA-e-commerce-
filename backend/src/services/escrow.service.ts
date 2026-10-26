import { Prisma } from "../../generated/prisma/client.js";
import { ApiError } from "../utils/api-error.js";

export async function createEscrowForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const existingEscrow = await tx.escrow.findUnique({
    where: {
      orderId,
    },
  });

  if (existingEscrow) {
    return existingEscrow;
  }

  const order = await tx.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      store: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!order.store.ownerId) {
    throw new ApiError(400, "This store does not have a valid seller");
  }

  if (Number(order.total) <= 0) {
    throw new ApiError(
      400,
      "Cannot create escrow for an order with zero total",
    );
  }

  return tx.escrow.create({
    data: {
      orderId: order.id,
      buyerId: order.userId,
      sellerId: order.store.ownerId,
      amount: order.total,
      currency: order.currency,
      status: "HELD",
      heldAt: new Date(),
    },
  });
}

export async function getEscrowByOrderId(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  return tx.escrow.findUnique({
    where: {
      orderId,
    },
  });
}

export async function requireEscrowForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const escrow = await tx.escrow.findUnique({
    where: {
      orderId,
    },
  });

  if (!escrow) {
    throw new ApiError(404, "Escrow record not found for this order");
  }

  return escrow;
}
