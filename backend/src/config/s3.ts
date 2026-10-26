import { S3Client } from "@aws-sdk/client-s3";
import { ApiError } from "../utils/api-error.js";

export interface S3MediaConfig {
  region: string;
  bucket: string;
  cloudFrontUrl: string;
}

let s3Client: S3Client | undefined;

export function getS3MediaConfig(): S3MediaConfig {
  const region = process.env.AWS_REGION?.trim();
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL?.trim();

  if (!region || !bucket || !cloudFrontUrl) {
    throw new ApiError(
      503,
      "Image uploads are not configured. Set AWS_REGION, AWS_S3_BUCKET and AWS_CLOUDFRONT_URL.",
      "MEDIA_STORAGE_NOT_CONFIGURED",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(cloudFrontUrl);
  } catch {
    throw new ApiError(
      503,
      "AWS_CLOUDFRONT_URL must be a valid HTTPS URL.",
      "INVALID_MEDIA_STORAGE_CONFIG",
    );
  }

  if (parsedUrl.protocol !== "https:") {
    throw new ApiError(
      503,
      "AWS_CLOUDFRONT_URL must use HTTPS.",
      "INVALID_MEDIA_STORAGE_CONFIG",
    );
  }

  return {
    region,
    bucket,
    cloudFrontUrl: cloudFrontUrl.replace(/\/+$/, ""),
  };
}

export function getS3Client(region: string): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({ region });
  }

  return s3Client;
}

export function buildPublicImageUrl(
  cloudFrontUrl: string,
  key: string,
): string {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${cloudFrontUrl}/${encodedKey}`;
}
