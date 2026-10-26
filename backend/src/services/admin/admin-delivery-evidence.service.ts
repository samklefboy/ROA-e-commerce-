import {
  DeliveryEvidenceStatus,
  Prisma,
} from "../../../generated/prisma/client.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type ListEvidenceInput = {
  status?: DeliveryEvidenceStatus;
  page?: number;
  limit?: number;
};

export async function listDeliveryEvidence(input: ListEvidenceInput = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new ApiError(
      400,
      "Page must be positive and limit must be between 1 and 100",
      "INVALID_PAGINATION",
    );
  }

  const where: Prisma.DeliveryEvidenceWhereInput = {};

  if (input.status !== undefined) {
    where.status = input.status;
  }

  const [items, total] = await prisma.$transaction([
    prisma.deliveryEvidence.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            currency: true,
            deliveredAt: true,
            user: {
              select: {
                id: true,
                phone: true,
              },
            },
            store: {
              select: {
                id: true,
                name: true,
                ownerId: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    }),
    prisma.deliveryEvidence.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
