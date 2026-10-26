import { ApiError } from "./api-error.js";

const NIGERIAN_PHONE_REGEX = /^(?:\+234|234|0)(?:7|8|9)\d{9}$/;

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s()-]/g, "");

  if (!NIGERIAN_PHONE_REGEX.test(cleaned)) {
    throw new ApiError(
      400,
      "Enter a valid Nigerian phone number",
      "INVALID_PHONE",
    );
  }

  if (cleaned.startsWith("+234")) {
    return cleaned.slice(1);
  }

  if (cleaned.startsWith("234")) {
    return cleaned;
  }

  return `234${cleaned.slice(1)}`;
}
