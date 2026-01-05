import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth
 *
 * Hook di accesso allo stato di autenticazione applicativo.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx; // { user, isAuthenticated, loading, ... }
}
