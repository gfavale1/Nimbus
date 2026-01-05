import { useMsal } from "@azure/msal-react";
import { useState } from "react";

/**
 * useMsalAuth
 *
 * Responsabilità:
 * - Gestione UX del login/logout Microsoft (MSAL)
 * - Nessuna gestione di token applicativi
 * - Nessuna conoscenza dello stato auth dell'app
 */
export function useMsalAuth() {
  const { instance } = useMsal();

  const [statusText, setStatusText] = useState("Connessione a Nimbus...");
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * Avvia il login Microsoft (popup).
   * Dopo il login, sarà l'AuthContext a verificare l'autenticazione tramite chiamata al backend (/api/users/me).
   */
  const signIn = async () => {
    try {
      setIsTransitioning(true);
      setStatusText("Connessione a Nimbus...");

      await instance.loginPopup({
        scopes: ["openid", "profile", "email"],
        prompt: "select_account",
      });

      console.log("[MSAL] Login Microsoft completato.");
    } catch (err) {
      console.error("[MSAL] Errore login:", err);
    } finally {
      setIsTransitioning(false);
    }
  };

  /**
   * Logout Microsoft (popup).
   */
  const signOut = async () => {
    try {
      setIsTransitioning(true);
      setStatusText("Disconnessione da Nimbus...");

      await instance.logoutPopup({
        postLogoutRedirectUri: "/login",
      });

      console.log("[MSAL] Logout Microsoft completato.");
    } catch (err) {
      console.error("[MSAL] Errore logout:", err);
    } finally {
      setIsTransitioning(false);
    }
  };

  return {
    signIn,
    signOut,
    statusText,
    isTransitioning,
  };
}
