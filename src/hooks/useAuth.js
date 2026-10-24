import { useCallback, useEffect } from "react";
import {
  refreshSession,
  logout as logoutRequest,
} from "../services/authService";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setSession,
    setLoading,
    clearSession,
  } = useAuthStore();

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);

      const data = await refreshSession();
      setSession({ user: data.user, accessToken: data.accessToken });
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [setSession, setLoading, clearSession]);

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

  return { user, accessToken, isAuthenticated, isLoading, logout };
}
