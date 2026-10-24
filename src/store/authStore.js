import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,

  accessToken: null,

  isAuthenticated: false,

  isLoading: true,

  setSession: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isLoading: false,
    }),

  setUser: (user) =>
    set({
      user,
    }),

  setAccessToken: (accessToken) =>
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    }),

  setLoading: (isLoading) =>
    set({
      isLoading,
    }),

  clearSession: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
