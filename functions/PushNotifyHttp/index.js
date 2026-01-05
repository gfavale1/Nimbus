const { sendPushOrEmail } = require("../lib/notify");

/**
 * Azure Function HTTP Trigger per l'invio di notifiche email (e/o push).
 *
 * La funzione riceve una richiesta HTTP contenente i dati della notifica
 * e delega l'invio al servizio `sendPushOrEmail`, che gestisce il canale
 * di notifica appropriato (attualmente email tramite Resend).
 *
 * @async
 * @function PushNotifyHttp
 *
 * @param {Object} context - Contesto di esecuzione Azure Function
 * @param {Object} context.log - Logger fornito da Azure
 * @param {Object} req - Richiesta HTTP
 * @param {Object} req.body - Corpo della richiesta
 * @param {string} req.body.userEmail - Email del destinatario
 * @param {string} req.body.title - Oggetto della notifica
 * @param {string} req.body.body - Contenuto HTML della notifica
 *
 * @returns {Promise<void>} Risposta HTTP con esito dell'operazione
 *
 * @throws {Error} In caso di errore interno durante l'invio della notifica
 */
module.exports = async function PushNotifyHttp(context, req) {
  try {
    const { userEmail, title, body } = req.body || {};

    // Validazione input
    if (!userEmail || !title || !body) {
      context.log.warn("[PushNotifyHttp] Body incompleto o non valido", {
        receivedBody: req.body,
      });

      context.res = {
        status: 400,
        body: {
          error: "userEmail, title e body sono obbligatori",
        },
      };
      return;
    }

    context.log("[PushNotifyHttp] Avvio invio notifica", {
      userEmail,
      title,
    });

    const result = await sendPushOrEmail({
      toEmail: userEmail,
      title,
      body,
    });

    context.log("[PushNotifyHttp] Notifica inviata con successo", {
      via: result.via,
      id: result.id || null,
    });

    context.res = {
      status: 200,
      body: {
        ok: true,
        via: result.via,
        id: result.id || null,
      },
    };
  } catch (error) {
    context.log.error("[PushNotifyHttp] Errore durante l'invio della notifica", {
      message: error.message,
      stack: error.stack,
    });

    context.res = {
      status: 500,
      body: {
        error: "Errore interno nell'invio della notifica",
      },
    };
  }
};
