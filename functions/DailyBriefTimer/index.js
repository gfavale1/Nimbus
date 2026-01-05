const { sendPushOrEmail } = require("../lib/notify");
const { generateDailyBriefForUser } = require("../lib/dailyBrief");
const { getUsersWithDailyBriefEnabled } = require("../lib/users");
const { dailyBriefTemplate } = require("../lib/templates/dailyBriefTemplate");

/**
 * Azure Function Timer Trigger per l'invio del Daily Brief AI agli utenti.
 *
 * La funzione viene eseguita periodicamente e:
 * - recupera gli utenti che hanno abilitato il Daily Brief
 * - genera un riepilogo giornaliero tramite Azure OpenAI
 * - formatta il contenuto tramite template HTML
 * - invia il riepilogo via email all'utente
 *
 * @async
 * @function DailyBriefTimer
 *
 * @param {Object} context - Contesto di esecuzione Azure Function
 * @param {Object} context.log - Logger fornito da Azure
 *
 * @returns {Promise<void>} Nessun valore di ritorno (Timer Trigger)
 */
module.exports = async function DailyBriefTimer(context) {
  context.log("[DailyBriefTimer] Avvio generazione Daily Brief");

  try {
    const users = await getUsersWithDailyBriefEnabled();

    for (const user of users) {
      const result = await generateDailyBriefForUser(user.id);

      // Supporta sia ritorno diretto che oggetto con campo `summary`
      const summaryText = result?.summary || result;

      if (!summaryText) {
        context.log.warn("[DailyBriefTimer] Daily Brief vuoto", {
          userId: user.id,
        });
        continue;
      }

      const htmlContent = dailyBriefTemplate(summaryText);

      await sendPushOrEmail({
        toEmail: user.email,
        title: "Il tuo Daily Brief AI – Nimbus",
        body: htmlContent,
      });

      context.log("[DailyBriefTimer] Daily Brief inviato", {
        userId: user.id,
      });
    }

    context.log("[DailyBriefTimer] Invio Daily Brief completato con successo");
  } catch (error) {
    context.log.error("[DailyBriefTimer] Errore durante l'esecuzione", {
      message: error.message,
      stack: error.stack,
    });
  }
};
