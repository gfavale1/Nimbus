/**
 * Model: NoteHistory
 *
 * Gestisce lo storico delle modifiche delle note tramite la tabella `note_history`.
 *
 * - recupera la cronologia delle versioni di una nota
 * - recupera una singola versione storica
 * - ripristina una versione su una nota esistente
 */

const db = require("../config/db");

/**
 * Restituisce lo storico delle versioni di una nota,
 * ordinate dalla più recente alla più vecchia.
 *
 * @param {number} noteId - ID della nota
 * @returns {Promise<Array>}
 */
async function findByNoteId(noteId) {
  const [rows] = await db.query(
    `SELECT *
     FROM note_history
     WHERE note_id = ?
     ORDER BY modified_at DESC`,
    [noteId]
  );
  return rows;
}

/**
 * Recupera una singola versione storica tramite ID.
 *
 * @param {number} historyId - ID della versione
 * @returns {Promise<Object|null>}
 */
async function findById(historyId) {
  const [rows] = await db.query(
    'SELECT * FROM note_history WHERE id = ?',
    [historyId]
  );
  return rows[0] || null;
}

/**
 * Ripristina una versione storica su una nota esistente.
 * Aggiorna titolo e contenuto della nota corrente.
 *
 * @param {number} noteId - ID della nota
 * @param {{title:string, content:string}} version - Versione da ripristinare
 * @returns {Promise<any>}
 */
async function restoreVersion(noteId, version) {
  return db.query(
    'UPDATE notes SET title = ?, content = ? WHERE id = ?',
    [version.title, version.content, noteId]
  );
}

module.exports = {
  findByNoteId,
  findById,
  restoreVersion,
};
