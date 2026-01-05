const db = require("./db");

/**
 * Recupera gli utenti che hanno abilitato la funzionalità di Daily Brief.
 *
 * La funzione interroga il database e restituisce l'elenco degli utenti
 * per i quali l'invio automatico del riepilogo giornaliero è attivo.
 *
 * @async
 * @function getUsersWithDailyBriefEnabled
 *
 * @returns {Promise<Array<{id: number, email: string}>>}
 *          Lista degli utenti con Daily Brief abilitato.
 *          Restituisce un array vuoto se non sono presenti utenti.
 */
async function getUsersWithDailyBriefEnabled() {
  const rows = await db.query(`
    SELECT id, email
    FROM users
    WHERE daily_brief_enabled = 1
  `);

  // db.query restituisce già un array (anche vuoto)
  return rows || [];
}

module.exports = {
  getUsersWithDailyBriefEnabled,
};
