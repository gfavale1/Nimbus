const db = require("../lib/db");
const { sendPushOrEmail } = require("../lib/notify");
const { taskReminderTemplate } = require("../lib/templates/taskReminderTemplate");

/**
 * Azure Function Timer Trigger per l'invio automatico dei promemoria sui task.
 *
 * La funzione viene eseguita periodicamente e:
 * - individua i task con scadenza imminente
 * - verifica che non sia già stato inviato un promemoria
 * - invia una notifica email all'utente
 * - marca il task come notificato per evitare duplicazioni
 *
 * Il tempo di anticipo del promemoria è configurabile tramite variabile
 * d'ambiente `REMINDER_DEFAULT_MIN_BEFORE` (default: 60 minuti).
 *
 * @async
 * @function RemindersTimer
 *
 * @param {Object} context - Contesto di esecuzione Azure Function
 * @param {Object} context.log - Logger fornito da Azure
 * @param {Object} myTimer - Oggetto Timer Trigger (non utilizzato direttamente)
 *
 * @returns {Promise<void>} Nessun valore di ritorno (Timer Trigger)
 */
module.exports = async function RemindersTimer(context, myTimer) {
  const minutesBeforeDue = Number(
    process.env.REMINDER_DEFAULT_MIN_BEFORE || 60
  );

  context.log("[RemindersTimer] Avvio controllo scadenze", {
    minutesBeforeDue,
  });

  try {
    // Recupera i task in scadenza entro la finestra temporale configurata
    const tasks = await db.query(
      `
      SELECT t.id, t.title, t.due_date, u.email
      FROM tasks t
      INNER JOIN users u ON u.id = t.user_id
      WHERE t.status != 'done'
        AND t.due_date IS NOT NULL
        AND (t.reminder_sent IS NULL OR t.reminder_sent = 0)
        AND TIMESTAMPDIFF(MINUTE, NOW(), t.due_date) BETWEEN 0 AND ?
      `,
      [minutesBeforeDue]
    );

    if (!tasks.length) {
      context.log("[RemindersTimer] Nessuna attività imminente trovata");
      return;
    }

    // Invio promemoria per ciascun task
    for (const task of tasks) {
      const htmlBody = taskReminderTemplate({
        taskTitle: task.title,
        dueDate: new Date(task.due_date).toLocaleString("it-IT"),
      });

      try {
        await sendPushOrEmail({
          toEmail: task.email,
          title: `Scadenza Imminente: ${task.title}`,
          body: htmlBody,
        });

        // Segna il promemoria come inviato per evitare duplicazioni
        await db.query(
          "UPDATE tasks SET reminder_sent = 1 WHERE id = ?",
          [task.id]
        );

        context.log("[RemindersTimer] Promemoria inviato con successo", {
          taskId: task.id,
        });
      } catch (error) {
        context.log.error(
          "[RemindersTimer] Errore durante l'invio del promemoria",
          {
            taskId: task.id,
            message: error.message,
          }
        );
      }
    }
  } catch (error) {
    context.log.error("[RemindersTimer] Errore generale durante l'esecuzione", {
      message: error.message,
      stack: error.stack,
    });
  }
};
