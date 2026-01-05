const axios = require("axios");

/**
 * Invia una notifica all'utente tramite email (provider Resend).
 *
 * La funzione incapsula la chiamata HTTP verso l'API di Resend e viene
 * utilizzata sia dalle Azure Functions sia dal backend applicativo.
 *
 * @async
 * @function sendPushOrEmail
 *
 * @param {Object} params - Parametri della notifica
 * @param {string} params.toEmail - Email del destinatario
 * @param {string} params.title - Oggetto dell'email
 * @param {string} params.body - Contenuto HTML dell'email
 *
 * @returns {Promise<Object>} Risultato dell'invio
 * @returns {boolean} returns.ok - Indica l'esito positivo dell'operazione
 * @returns {string} returns.via - Provider utilizzato per l'invio
 * @returns {string|null} returns.id - ID del messaggio restituito dal provider
 *
 * @throws {Error} Se la chiave API di Resend non è configurata
 */
async function sendPushOrEmail({ toEmail, title, body }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY non configurata");
  }

  const payload = {
    from: process.env.RESEND_EMAIL_FROM,
    to: toEmail,
    subject: title,
    html: body,
  };

  const response = await axios.post(
    "https://api.resend.com/emails",
    payload,
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    ok: true,
    via: "resend",
    id: response.data?.id || null,
  };
}

module.exports = { sendPushOrEmail };
