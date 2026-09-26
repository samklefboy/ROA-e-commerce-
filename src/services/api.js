import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/*  Separate refresh client */
/*Important:  This client has NO interceptors. | Otherwise /auth/refresh could trigger another refresh loop. | */
const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/*  Request interceptor  */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/*  Refresh coordination, If five API requests expire at the same time, we only make ONE refresh request. */
let refreshPromise = null;
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/api/auth/refresh")
      .then((response) => {
        const { accessToken, user } = response.data;
        useAuthStore.getState().setSession({ user, accessToken });
        return accessToken;
      })
      .catch((error) => {
        useAuthStore.getState().clearSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/*  Response interceptor  */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url === "/api/auth/refresh"
    ) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      const newAccessToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
export default api;
