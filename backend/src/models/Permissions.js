/**
 * Permissions
 *
 * Centralizza la logica di autorizzazione per note e task.
 * Fornisce funzioni "booleane" utilizzate da controller e middleware per verificare i permessi dell'utente autenticato.
 */

const db = require('../config/db');

/**
 * Verifica se un utente può visualizzare una nota.
 *
 * Regole:
 * - l'utente è owner della nota
 * - oppure la nota è condivisa con ruolo viewer/editor/owner
 *
 * @param {number} userId - ID utente
 * @param {number} noteId - ID nota
 * @returns {Promise<boolean>}
 */
async function canViewNote(userId, noteId) {
  const [rows] = await db.execute(`
    SELECT 1
    FROM notes n
    LEFT JOIN note_shares s
      ON s.note_id = n.id AND s.user_id = ?
    WHERE n.id = ?
      AND (n.owner_id = ? OR s.role IN ('owner', 'editor', 'viewer'))
    LIMIT 1
  `, [userId, noteId, userId]);

  return rows.length > 0;
}

/**
 * Verifica se un utente può modificare una nota.
 *
 * Regole:
 * - l'utente è owner della nota
 * - oppure la nota è condivisa con ruolo editor/owner
 *
 * @param {number} userId - ID utente
 * @param {number} noteId - ID nota
 * @returns {Promise<boolean>}
 */
async function canEditNote(userId, noteId) {
  const [rows] = await db.execute(`
    SELECT 1
    FROM notes n
    LEFT JOIN note_shares s
      ON s.note_id = n.id AND s.user_id = ?
    WHERE n.id = ?
      AND (n.owner_id = ? OR s.role IN ('owner', 'editor'))
    LIMIT 1
  `, [userId, noteId, userId]);

  return rows.length > 0;
}

/**
 * Verifica se un utente è proprietario di un task.
 *
 * @param {number} userId - ID utente
 * @param {number} taskId - ID task
 * @returns {Promise<boolean>}
 */
async function isTaskOwner(userId, taskId) {
  const [rows] = await db.execute(
    'SELECT 1 FROM tasks WHERE id = ? AND owner_id = ? LIMIT 1',
    [taskId, userId]
  );

  return rows.length > 0;
}

module.exports = {
  canViewNote,
  canEditNote,
  isTaskOwner
};
