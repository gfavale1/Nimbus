import axios from "axios";

/**
 * Nimbus HTTP client (Axios)
 *
 * Principi architetturali:
 * - Nessuna dipendenza da MSAL o auth qui dentro.
 * - Easy Auth (su Azure) gestisce l’identità tramite cookie/header a livello di piattaforma.
 * - In locale si usa il backend dev-auth (mock / fallback), quindi comunque niente Bearer token.
 *
 * Configurazione:
 * - baseURL da env (Vite): VITE_API_BASE_URL
 */

const baseURL = "https://nimbus-app-ashhgbbrdvhjdgh6.italynorth-01.azurewebsites.net/api";

const http = axios.create({
  baseURL,
  withCredentials: true, // fondamentale: cookie/sessione (Easy Auth) + CORS credentials
});

/**
 * Normalizza gli errori Axios in un formato prevedibile.
 * Così i services non devono gestire mille shape diverse.
 */
function normalizeAxiosError(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data ?? null;

  return {
    status,
    data,
    message:
      data?.message ||
      data?.error ||
      error?.message ||
      "Errore di rete o risposta non valida",
    raw: error,
  };
}

/**
 * Interceptor di risposta:
 * - 401: non autenticato
 * - 403: autenticato ma non autorizzato
 *
 * Nota: NON faccio logout MSAL qui, ma mando solo un segnale globale; la UI (AuthContext / router)
 * decide poi che fare (redirect, toast, ecc.).
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // segnali globali (evitano import circolari con auth/router)
    if (status === 401) {
      window.dispatchEvent(new CustomEvent("nimbus:unauthorized"));
    }
    if (status === 403) {
      window.dispatchEvent(new CustomEvent("nimbus:forbidden"));
    }

    return Promise.reject(normalizeAxiosError(error));
  }
);

export default http;
