import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the current access token to normal requests.
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Prevent multiple refresh requests from happening
// at the same time.
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then((response) => {
        const data = response.data.data;

        useAuthStore.getState().setSession({
          user: data.user,
          accessToken: data.accessToken,
        });

        return data.accessToken;
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

// Handle expired access tokens.
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 responses.
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    //Prevent retry loops.
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
