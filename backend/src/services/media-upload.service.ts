import { randomUUID } from "node:crypto";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import {
  buildPublicImageUrl,
  getS3Client,
  getS3MediaConfig,
} from "../config/s3.js";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const MEDIA_PURPOSES = [
  "PRODUCT",
  "STORE_LOGO",
  "STORE_COVER",
  "PROFILE",
  "PROMOTION",
] as const;

export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";

const IMAGE_EXTENSIONS: Record<SupportedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface CreateMediaUploadInput {
  userId: string;
  purpose: MediaPurpose;
  contentType: SupportedImageType;
  fileSize: number;
}

interface UploadPathContext {
  storeId?: string;
}

const UUID_IMAGE_KEY = /^[0-9a-f-]{36}\.(jpg|png|webp)$/i;

export async function verifyMediaUpload(input: {
  userId: string;
  purpose: MediaPurpose;
  key: string;
}) {
  const config = getS3MediaConfig();
  const segments = input.key.split("/");
  const filename = segments[segments.length - 1] ?? "";

  if (!UUID_IMAGE_KEY.test(filename)) {
    throw new ApiError(400, "Invalid image object key.", "INVALID_MEDIA_KEY");
  }

  let authorized = false;

  switch (input.purpose) {
    case "PRODUCT":
    case "PROMOTION": {
      const store = await prisma.store.findUnique({
        where: { ownerId: input.userId },
        select: { id: true, status: true },
      });

      if (!store || store.status !== "ACTIVE") {
        throw new ApiError(
          403,
          "An active store is required for this upload.",
          "STORE_NOT_ACTIVE",
        );
      }

      const prefix = input.purpose === "PRODUCT" ? "products" : "promotions";

      authorized =
        segments.length === 3 &&
        segments[0] === prefix &&
        segments[1] === store.id;
      break;
    }

    case "STORE_LOGO":
      authorized =
        segments.length === 4 &&
        segments[0] === "stores" &&
        segments[1] === input.userId &&
        segments[2] === "logo";
      break;

    case "STORE_COVER":
      authorized =
        segments.length === 4 &&
        segments[0] === "stores" &&
        segments[1] === input.userId &&
        segments[2] === "cover";
      break;

    case "PROFILE":
      authorized =
        segments.length === 3 &&
        segments[0] === "profiles" &&
        segments[1] === input.userId;
      break;
  }

  if (!authorized) {
    throw new ApiError(
      403,
      "You are not authorized to use this image.",
      "MEDIA_OWNERSHIP_MISMATCH",
    );
  }

  const s3 = getS3Client(config.region);

  let object;

  try {
    object = await s3.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
      }),
    );
  } catch {
    throw new ApiError(
      400,
      "The image was not found in storage. Upload it before verifying.",
      "MEDIA_UPLOAD_NOT_FOUND",
    );
  }

  const allowedTypes = Object.keys(IMAGE_EXTENSIONS);

  if (
    !object.ContentType ||
    !allowedTypes.includes(object.ContentType) ||
    !Number.isInteger(object.ContentLength) ||
    object.ContentLength! < 1 ||
    object.ContentLength! > MAX_IMAGE_SIZE_BYTES
  ) {
    throw new ApiError(
      400,
      "The uploaded image has an invalid type or size.",
      "INVALID_UPLOADED_MEDIA",
    );
  }

  const extension = filename.split(".").pop()?.toLowerCase();
  const expectedType =
    extension === "jpg"
      ? "image/jpeg"
      : extension === "png"
        ? "image/png"
        : "image/webp";

  if (object.ContentType !== expectedType) {
    throw new ApiError(
      400,
      "The uploaded file extension and content type do not match.",
      "MEDIA_CONTENT_TYPE_MISMATCH",
    );
  }

  return {
    key: input.key,
    purpose: input.purpose,
    imageUrl: buildPublicImageUrl(config.cloudFrontUrl, input.key),
    contentType: object.ContentType,
    fileSize: object.ContentLength,
  };
}

async function getUploadPathContext(
  userId: string,
  purpose: MediaPurpose,
): Promise<UploadPathContext> {
  if (purpose === "PRODUCT" || purpose === "PROMOTION") {
    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
      select: { id: true, status: true },
    });

    if (!store) {
      throw new ApiError(
        403,
        "You must create a store before uploading this image.",
        "STORE_REQUIRED",
      );
    }

    if (store.status !== "ACTIVE") {
      throw new ApiError(
        403,
        "Your store must be active to upload this type of image.",
        "STORE_NOT_ACTIVE",
      );
    }

    return { storeId: store.id };
  }

  // Store logos and covers must be uploadable during store setup,
  // before a Store record exists or becomes active.
  return {};
}

function buildObjectKey(
  userId: string,
  purpose: MediaPurpose,
  extension: string,
  context: UploadPathContext,
): string {
  const uniqueName = `${randomUUID()}.${extension}`;

  switch (purpose) {
    case "PRODUCT":
      return `products/${context.storeId}/${uniqueName}`;

    case "STORE_LOGO":
      return `stores/${userId}/logo/${uniqueName}`;

    case "STORE_COVER":
      return `stores/${userId}/cover/${uniqueName}`;

    case "PROFILE":
      return `profiles/${userId}/${uniqueName}`;

    case "PROMOTION":
      return `promotions/${context.storeId}/${uniqueName}`;
  }
}

export async function createMediaUpload(input: CreateMediaUploadInput) {
  if (
    !Number.isInteger(input.fileSize) ||
    input.fileSize < 1 ||
    input.fileSize > MAX_IMAGE_SIZE_BYTES
  ) {
    throw new ApiError(
      400,
      "Each image must be between 1 byte and 5 MB.",
      "INVALID_IMAGE_SIZE",
    );
  }

  const config = getS3MediaConfig();
  const context = await getUploadPathContext(input.userId, input.purpose);

  const extension = IMAGE_EXTENSIONS[input.contentType];

  if (!extension) {
    throw new ApiError(
      400,
      "Only JPEG, PNG and WebP images are supported.",
      "UNSUPPORTED_IMAGE_TYPE",
    );
  }

  const key = buildObjectKey(input.userId, input.purpose, extension, context);

  const s3 = getS3Client(config.region);

  const signedPost = await createPresignedPost(s3, {
    Bucket: config.bucket,
    Key: key,
    Expires: 300,
    Fields: {
      key,
      "Content-Type": input.contentType,
    },
    Conditions: [
      ["eq", "$key", key],
      ["eq", "$Content-Type", input.contentType],
      ["content-length-range", 1, MAX_IMAGE_SIZE_BYTES],
    ],
  });

  return {
    uploadUrl: signedPost.url,
    fields: signedPost.fields,
    key,
    imageUrl: buildPublicImageUrl(config.cloudFrontUrl, key),
    expiresInSeconds: 300,
    maxFileSizeBytes: MAX_IMAGE_SIZE_BYTES,
  };
}
