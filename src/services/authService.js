import api, { refreshClient } from "./api";

export async function requestOtp(phone) {
  const response = await api.post("/auth/register", { phone });
  return response.data.data;
}

export async function verifyOtp({ phone, otp }) {
  const response = await api.post("/auth/verify-otp", { phone, otp });
  return response.data.data;
}

export const createPassword = async (token, password) => {
  const response = await api.post("/auth/create-password", {
    token,
    password,
  });

  return response.data.data;
};

export const login = async (phone, password) => {
  const response = await api.post("/auth/login", {
    phone,
    password,
  });

  return response.data.data;
};

export async function refreshSession() {
  const response = await refreshClient.post("/auth/refresh");
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.data;
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return response.data.data;
}

export async function logoutAll() {
  const response = await api.post("/auth/logout-all");
  return response.data.data;
}
