/**
 * notifierClient
 *
 * Client HTTP per l'invio di notifiche email tramite Azure Function.
 * Incapsula la chiamata alla Function esterna e garantisce che eventuali errori non interrompano il flusso del backend.
 *
 * Se le variabili d'ambiente non sono configurate, le notifiche le disabilito (fail-safe).
 */

const axios = require("axios");

const base = process.env.NOTIFY_FN_BASEURL;
const key = process.env.NOTIFY_FN_KEY;

if (!base || !key) {
  console.warn("[notifierClient] NOTIFY_FN_BASEURL/KEY mancanti. Notifiche disabilitate.");
}

/**
 * Invia una notifica email tramite Azure Function.
 *
 * @param {Object} params
 * @param {string} params.userEmail - Email del destinatario
 * @param {string} params.title - Oggetto della notifica
 * @param {string} params.body - Contenuto testuale della notifica
 *
 * @returns {Promise<Object>} Risultato dell'invio o stato di fallback
 *
 * NOTE:
 * - Non lancia eccezioni (no throw)
 * - In caso di errore restituisce un oggetto { ok: false }
 * NB = L'ho pensato per non bloccare le operazioni principali del backend senno mi causava problemi
 */

async function notifyByEmail({ userEmail, title, body }) {
  if (!base || !key) {
    return { ok: false, skipped: true, reason: "missing-config" };
  }

  const url = `${base.replace(/\/+$/, "")}/api/notify?code=${encodeURIComponent(key)}`;
  const payload = { userEmail, title, body };

  try {
    const { data } = await axios.post(url, payload, {
      timeout: 10000, // Aumentato a 10s per risveglio Azure
      headers: { "Content-Type": "application/json" },
    });
    return data;
  } catch (err) {
    // Logghiamo l'errore ma non la lanciamo l'eccezione (throw)
    console.error(`[notifierClient] Errore invio email a ${userEmail}:`, err.message);
    
    // Restituiamo un oggetto che indica il fallimento senza scassare il flusso
    return { ok: false, error: err.message };
  }
}

module.exports = { notifyByEmail };