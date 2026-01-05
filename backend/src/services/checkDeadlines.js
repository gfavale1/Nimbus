/**
 * Service di background per il controllo delle scadenze imminenti.
 *
 * Responsabilità:
 * - individuare i task che scadono nelle prossime 24 ore
 * - recuperare le informazioni dell’utente associato
 * - inviare una notifica di promemoria tramite notifyService
 */

const db = require("../config/db");
const { notifyTaskExpiring } = require("../services/notifyService");

/**
 * Controlla i task con scadenza imminente e invia notifiche.
 *
 * Logica:
 * - seleziona task con due_date entro le prossime 24 ore
 * - esclude task già completati
 * - arricchisce il task con dati utente (email, display_name)
 * - invia una notifica per ogni task che tiene l'utente
 * (Ho avuto troppi problemi con questa parte NB)
 */
async function checkUpcomingTasks() {
  try {
    /**
     * Query:
     * - task con scadenza entro 24 ore
     * - task non ancora completati
     * - join con users per recuperare i dati di notifica
     */
    const [tasks] = await db.query(`
      SELECT 
        t.*, 
        u.email, 
        u.display_name
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.due_date <= DATE_ADD(NOW(), INTERVAL 1 DAY)
        AND t.due_date > NOW()
        AND t.status IN ('todo', 'in_progress')
    `);

    // Itera sui task trovati e invia la notifica
    for (const task of tasks) {
      const user = {
        id: task.user_id,
        email: task.email,
        display_name: task.display_name
      };

      await notifyTaskExpiring(task, user);
    }
  } catch (err) {
    console.error("Errore nel controllo delle scadenze imminenti:", err);
  }
}

module.exports = { checkUpcomingTasks };
