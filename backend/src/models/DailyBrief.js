/**
 * Model: DailyBrief
 *
 * Gestisce la persistenza dei "Daily Brief" generati per un utente.
 * Ogni brief l'ho fatto assdociare a:
 * - un utente
 * - una data (brief_date)
 * - il contenuto generato dall'AI
 * - metadati di generazione (modello, deployment, token)
 *
 * - recupera il brief di un utente per una data specifica
 * - crea un nuovo brief
 * - aggiorna il contenuto del brief
 * - traccia il numero di rigenerazione
 */

const db = require("../config/db");

/**
 * Recupera il Daily Brief di un utente per una specifica data.
 *
 * @param {number} userId - ID utente
 * @param {string} date - Data del brief (YYYY-MM-DD)
 * @returns {Promise<Object|null>}
 */
async function findByUserAndDate(userId, date) {
  const [rows] = await db.query(
    `SELECT *
     FROM daily_briefs
     WHERE user_id = ? AND brief_date = ?`,
    [userId, date]
  );
  return rows[0] || null;
}

/**
 * Crea un nuovo Daily Brief.
 *
 * @param {Object} data
 * @param {number} data.user_id
 * @param {string} data.brief_date
 * @param {string} data.content
 * @param {string} data.model
 * @param {string} data.deployment
 * @param {number|null} data.prompt_tokens
 * @param {number|null} data.completion_tokens
 * @param {number|null} data.total_tokens
 */
async function create(data) {
  const {
    user_id,
    brief_date,
    content,
    model,
    deployment,
    prompt_tokens = null,
    completion_tokens = null,
    total_tokens = null,
  } = data;

  await db.query(
    `INSERT INTO daily_briefs
     (user_id, brief_date, content, model, deployment, prompt_tokens, completion_tokens, total_tokens)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      brief_date,
      content,
      model,
      deployment,
      prompt_tokens,
      completion_tokens,
      total_tokens,
    ]
  );
}

/**
 * Aggiorna il contenuto testuale di un Daily Brief esistente.
 *
 * @param {number} id - ID del brief
 * @param {string} content - Nuovo contenuto
 */
async function updateContent(id, content) {
  await db.query(
    'UPDATE daily_briefs SET content = ? WHERE id = ?',
    [content, id]
  );
}

/**
 * Incrementa il contatore di rigenerazioni del brief
 * (usato quando l'utente forza una nuova generazione).
 *
 * @param {number} userId
 * @param {string} date - Data del brief (YYYY-MM-DD)
 */
async function incrementRegeneration(userId, date) {
  await db.query(
    `UPDATE daily_briefs
     SET regenerated_count = regenerated_count + 1
     WHERE user_id = ? AND brief_date = ?`,
    [userId, date]
  );
}

module.exports = {
  findByUserAndDate,
  create,
  updateContent,
  incrementRegeneration,
};
