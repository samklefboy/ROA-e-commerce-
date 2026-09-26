/*
import { useCallback, useEffect } from "react";
import {
  refreshSession,
  logout as logoutRequest,
} from "../services/authService";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const {
    user,
    hasStore,
    accessToken,
    isAuthenticated,
    isLoading,
    setSession,
    clearSession,
  } = useAuthStore();

  const initializeAuth = useCallback(async () => {
    try {
      const data = await refreshSession();
      setSession({ user: data.user, accessToken: data.accessToken });
    } catch {
      clearSession();
    }
  }, [setSession, clearSession]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return { user, accessToken, hasStore, isAuthenticated, isLoading, logout };
}
*/

import { useCallback, useEffect } from "react";

import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setLoading,
    clearSession,
  } = useAuthStore();

  const initializeAuth = useCallback(() => {
    /*
     * Auth V1 does not have refresh sessions yet.
     *
     * The access token currently lives in the Zustand store.
     * If there is no token, there is no authenticated session
     * to restore.
     */
    setLoading(false);
  }, [setLoading]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    logout,
  };
}
