/**
 * settingsService
 *
 * Service responsabile della gestione delle preferenze utente.
 * Incapsula l'accesso alla tabella `user_settings` e fornisce i valori di default in caso di primo accesso.
 *
 * Questo service viene utilizzato da:
 *  - settingsController
 *  - notifyService (per il controllo delle preferenze)
 */

const db = require("../config/db");

/**
 * Recupera le impostazioni di un utente.
 *
 * Se le impostazioni non esistono (primo accesso),
 * vengono create automaticamente con valori di default.
 *
 * @param {number} userId - ID dell'utente
 * @returns {Promise<Object>} Oggetto con le impostazioni utente
 */
async function getUserSettings(userId) {
  const [rows] = await db.query(
    "SELECT * FROM user_settings WHERE user_id = ?",
    [userId]
  );

  // Primo accesso: inizializza le impostazioni con valori di default
  if (rows.length === 0) {
    await db.query(
      "INSERT INTO user_settings (user_id) VALUES (?)",
      [userId]
    );

    return {
      user_id: userId,
      notify_email: true,
      notify_push: true,
      notify_reminders: true
    };
  }

  return rows[0];
}

/**
 * Aggiorna le impostazioni di notifica di un utente.
 *
 * I valori vengono normalizzati a booleano per evitare
 * incoerenze dovute a input non tipizzati (es. come il form frontend).
 *
 * @param {number} userId - ID dell'utente
 * @param {Object} settings - Nuove impostazioni
 */
async function updateUserSettings(userId, settings) {
  const {
    notify_email,
    notify_push,
    notify_reminders
  } = settings;

  await db.query(
    `
    UPDATE user_settings
    SET notify_email = ?, notify_push = ?, notify_reminders = ?
    WHERE user_id = ?
    `,
    [
      !!notify_email,
      !!notify_push,
      !!notify_reminders,
      userId
    ]
  );
}

module.exports = {
  getUserSettings,
  updateUserSettings
};
