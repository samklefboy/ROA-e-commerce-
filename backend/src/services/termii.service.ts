/*import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const TERMII_URL = "https://api.ng.termii.com/api/sms/send";

type TermiiResponse = {
  message_id?: string;
  message?: string;
  balance?: number;
  user?: string;
};

function formatTermiiPhone(phone: string): string {
  if (phone.startsWith("+234")) {
    return phone.substring(1);
  }

  if (phone.startsWith("0")) {
    return `234${phone.substring(1)}`;
  }

  return phone;
}

export async function sendOTP(
  phone: string,
  otp: string,
): Promise<TermiiResponse> {
  const formattedPhone = formatTermiiPhone(phone);

  const response = await fetch(TERMII_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: env.TERMII_API_KEY,
      to: formattedPhone,
      from: env.TERMII_SENDER_ID,
      sms: `Your R.O.A verification code is ${otp}. It expires in 5 minutes.`,
      type: "plain",
      channel: "dnd",
    }),
  });

  const body = (await response.json()) as TermiiResponse;

  if (!response.ok) {
    console.error("Termii error:", body);

    throw new ApiError(
      502,
      "Unable to send verification code",
      "OTP_PROVIDER_ERROR",
    );
  }

  return body;
}*/

import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const TERMII_URL = "https://api.ng.termii.com/api/sms/send";

type TermiiResponse = {
  message_id?: string;
  message?: string;
  balance?: number;
  user?: string;
};

function formatTermiiPhone(phone: string): string {
  if (phone.startsWith("+234")) {
    return phone.substring(1);
  }

  if (phone.startsWith("0")) {
    return `234${phone.substring(1)}`;
  }

  return phone;
}

export async function sendOTP(
  phone: string,
  otp: string,
): Promise<TermiiResponse> {
  if (!env.TERMII_API_KEY || !env.TERMII_SENDER_ID) {
    console.log("=================================");
    console.log("TERMII NOT CONFIGURED");
    console.log(`OTP for ${phone}: ${otp}`);
    console.log("=================================");

    return {
      message: "OTP generated successfully in development mode",
    };
  }

  const formattedPhone = formatTermiiPhone(phone);

  const response = await fetch(TERMII_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: env.TERMII_API_KEY,
      to: formattedPhone,
      from: env.TERMII_SENDER_ID,
      sms: `Your R.O.A verification code is ${otp}. It expires in 5 minutes.`,
      type: "plain",
      channel: "dnd",
    }),
  });

  const text = await response.text();

  let body: TermiiResponse;

  try {
    body = JSON.parse(text) as TermiiResponse;
  } catch {
    console.error("Invalid response from Termii:", text);

    throw new ApiError(
      502,
      "Invalid response from OTP provider",
      "OTP_PROVIDER_ERROR",
    );
  }

  if (!response.ok) {
    console.error("Termii error:", body);

    throw new ApiError(
      502,
      "Unable to send verification code",
      "OTP_PROVIDER_ERROR",
    );
  }

  return body;
}
