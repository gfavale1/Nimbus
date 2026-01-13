const { sendPushOrEmail } = require("../lib/notify");
const { generateDailyBriefForUser } = require("../lib/dailyBrief");
const { getUsersWithDailyBriefEnabled } = require("../lib/users");
const { dailyBriefTemplate } = require("../lib/mailTemplates/dailyBriefTemplate");

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
 * @param {Object} myTimer - Oggetto Timer Trigger 
 *
 * @returns {Promise<void>} Nessun valore di ritorno (Timer Trigger)
 */
module.exports = async function DailyBriefTimer(context, myTimer) {
  context.log("[DailyBriefTimer] Avvio generazione Daily Brief", {
    scheduleStatus: myTimer?.scheduleStatus,
    isPastDue: myTimer?.isPastDue,
  });

  let users = [];
  try {
    users = await getUsersWithDailyBriefEnabled();
    context.log("[DailyBriefTimer] Utenti con Daily Brief abilitato:", {
      count: users.length,
    });

    for (const user of users) {
      try {
        if (!user?.email) {
          context.log.warn("[DailyBriefTimer] Utente senza email, skip", {
            userId: user?.id,
          });
          continue;
        }

        const result = await generateDailyBriefForUser(user.id);
        const summaryText = result?.summary || result;

        if (!summaryText) {
          context.log.warn("[DailyBriefTimer] Daily Brief vuoto, skip", {
            userId: user.id,
            email: user.email,
          });
          continue;
        }

        context.log("[DailyBriefTimer] Summary generata", {
          userId: user.id,
          email: user.email,
          summaryLength: String(summaryText).length,
        });

        const htmlContent = dailyBriefTemplate(summaryText);

        const sendResult = await sendPushOrEmail({
          toEmail: user.email,
          title: "Il tuo Daily Brief AI – Nimbus",
          body: htmlContent,
        });

        context.log("[DailyBriefTimer] Invio completato", {
          userId: user.id,
          email: user.email,
          sendResult: sendResult ?? null,
        });
      } catch (errUser) {
        context.log.error("[DailyBriefTimer] Errore su singolo utente", {
          userId: user?.id,
          email: user?.email,
          message: errUser.message,
          stack: errUser.stack,
        });
      }
    }

    context.log("[DailyBriefTimer] Fine esecuzione");
  } catch (error) {
    context.log.error("[DailyBriefTimer] Errore durante l'esecuzione", {
      message: error.message,
      stack: error.stack,
    });
  }
};
