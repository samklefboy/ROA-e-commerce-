import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

type SubmitDeliveryEvidenceInput = {
  sellerId: string;
  orderId: string;
  evidenceType: string;
  fileUrls?: string[];
  recipientName?: string;
  deliveryNote?: string;
};

export async function submitDeliveryEvidence(
  input: SubmitDeliveryEvidenceInput,
) {
  const {
    sellerId,
    orderId,
    evidenceType,
    fileUrls,
    recipientName,
    deliveryNote,
  } = input;

  const normalizedOrderId = orderId.trim();
  const normalizedSellerId = sellerId.trim();
  const normalizedType = evidenceType.trim().toUpperCase();
  const normalizedRecipient = recipientName?.trim() || undefined;
  const normalizedNote = deliveryNote?.trim() || undefined;

  const normalizedUrls = fileUrls?.map((url) => url.trim()).filter(Boolean);

  if (!normalizedOrderId) {
    throw new ApiError(400, "Order ID is required", "ORDER_ID_REQUIRED");
  }

  if (!normalizedSellerId) {
    throw new ApiError(400, "Seller ID is required", "SELLER_ID_REQUIRED");
  }

  if (!normalizedType) {
    throw new ApiError(
      400,
      "Evidence type is required",
      "EVIDENCE_TYPE_REQUIRED",
    );
  }

  if (
    (normalizedUrls?.length ?? 0) > 10 ||
    normalizedUrls?.some((url) => !/^https?:\/\/\S+$/i.test(url))
  ) {
    throw new ApiError(
      400,
      "Provide no more than 10 valid HTTP or HTTPS evidence URLs",
      "INVALID_EVIDENCE_URL",
    );
  }

  if (!normalizedUrls?.length && !normalizedRecipient && !normalizedNote) {
    throw new ApiError(
      400,
      "Provide at least one evidence file, recipient name, or delivery note",
      "DELIVERY_EVIDENCE_REQUIRED",
    );
  }

  if (normalizedRecipient && normalizedRecipient.length > 120) {
    throw new ApiError(
      400,
      "Recipient name cannot exceed 120 characters",
      "RECIPIENT_NAME_TOO_LONG",
    );
  }

  if (normalizedNote && normalizedNote.length > 2000) {
    throw new ApiError(
      400,
      "Delivery note cannot exceed 2000 characters",
      "DELIVERY_NOTE_TOO_LONG",
    );
  }

  return prisma.$transaction(
    async (tx) => {
      // Serialize evidence submissions and reviews for this order.
      // PostgreSQL row locking prevents concurrent submissions from
      // passing the duplicate check simultaneously.
      const lockedOrders = await tx.$queryRaw<{ id: string }[]>(
        Prisma.sql`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${normalizedOrderId}
          FOR UPDATE
        `,
      );

      if (lockedOrders.length === 0) {
        throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
      }

      const order = await tx.order.findUnique({
        where: { id: normalizedOrderId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          store: {
            select: {
              ownerId: true,
            },
          },
          escrow: {
            select: {
              status: true,
            },
          },
          dispute: {
            select: {
              status: true,
            },
          },
        },
      });

      if (!order) {
        throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
      }

      if (order.store.ownerId !== normalizedSellerId) {
        throw new ApiError(
          403,
          "You are not authorized to submit evidence for this order",
          "ORDER_SELLER_FORBIDDEN",
        );
      }

      if (order.status !== "IN_DELIVERY") {
        throw new ApiError(
          409,
          "Delivery evidence can only be submitted while the order is in delivery",
          "ORDER_NOT_IN_DELIVERY",
        );
      }

      if (order.paymentStatus !== "PAID") {
        throw new ApiError(
          409,
          "Delivery evidence can only be submitted for a paid order",
          "ORDER_NOT_PAID",
        );
      }

      if (!order.escrow || order.escrow.status !== "HELD") {
        throw new ApiError(
          409,
          "Delivery evidence requires escrow to remain held",
          "ESCROW_NOT_HELD",
        );
      }

      if (
        order.dispute &&
        (order.dispute.status === "OPEN" ||
          order.dispute.status === "UNDER_REVIEW")
      ) {
        throw new ApiError(
          409,
          "Resolve the active dispute before submitting delivery evidence",
          "ACTIVE_DISPUTE_EXISTS",
        );
      }

      // Rejected records remain available for audit.
      // Pending and accepted records prevent duplicate submissions.
      const existingEvidence = await tx.deliveryEvidence.findFirst({
        where: {
          orderId: order.id,
          status: {
            in: ["PENDING_REVIEW", "ACCEPTED"],
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (existingEvidence) {
        if (existingEvidence.status === "ACCEPTED") {
          throw new ApiError(
            409,
            "Delivery evidence has already been accepted for this order",
            "EVIDENCE_ALREADY_ACCEPTED",
          );
        }

        throw new ApiError(
          409,
          "Delivery evidence is already awaiting review for this order",
          "EVIDENCE_PENDING_REVIEW",
        );
      }

      const evidence = await tx.deliveryEvidence.create({
        data: {
          orderId: order.id,
          sellerId: normalizedSellerId,
          evidenceType: normalizedType,
          ...(normalizedUrls?.length
            ? {
                fileUrls: normalizedUrls as Prisma.InputJsonArray,
              }
            : {}),
          ...(normalizedRecipient
            ? { recipientName: normalizedRecipient }
            : {}),
          ...(normalizedNote ? { deliveryNote: normalizedNote } : {}),
          status: "PENDING_REVIEW",
        },
      });

      return {
        id: evidence.id,
        orderId: evidence.orderId,
        evidenceType: evidence.evidenceType,
        fileUrls: evidence.fileUrls,
        recipientName: evidence.recipientName,
        deliveryNote: evidence.deliveryNote,
        status: evidence.status,
        submittedAt: evidence.submittedAt,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
}
