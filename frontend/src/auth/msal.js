import { PublicClientApplication } from "@azure/msal-browser";

/**
 * MSAL configuration
 *
 * Ruolo:
 * - Solo login / logout Microsoft (UX)
 */
const redirectUri = import.meta.env.VITE_MSAL_REDIRECT_URI;

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
