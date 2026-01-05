/**
 * Model: Attachment
 *
 * Gestisce la persistenza degli allegati associati a note o task.
 * L'allegato è sempre riferito a UNA sola entità:
 *  - note_id oppure task_id
 *
 * - crea record di allegati nel database
 * - recupera allegati per nota o task
 * - elimina allegati dal database
*/

const db = require('../config/db');

/**
 * Normalizza valori undefined in null
 * (necessario per campi opzionali come task_id).
 */
const nn = v => (v === undefined ? null : v);

/**
 * Crea un nuovo allegato.
 *
 * @param {Object} d
 * @param {number|null} d.note_id
 * @param {number|null} d.task_id
 * @param {number} d.uploader_id
 * @param {string} d.blob_name
 * @param {string} d.file_name
 * @param {string} d.content_type
 * @param {number} d.size
 * @param {string|null} d.etag
 * @returns {Promise<Object>}
 */
async function createAttachment(d) {
  const [res] = await db.execute(
    `INSERT INTO attachments
     (note_id, task_id, uploader_id, blob_name, file_name, content_type, size, etag)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nn(d.note_id),
      nn(d.task_id),
      nn(d.uploader_id),
      nn(d.blob_name),
      nn(d.file_name),
      nn(d.content_type),
      Number.isFinite(d.size) ? d.size : 0,
      nn(d.etag),
    ]
  );

  return { id: res.insertId, ...d };
}

/**
 * Recupera un allegato per ID.
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
  const [rows] = await db.execute(
    'SELECT * FROM attachments WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Elenca tutti gli allegati associati a una nota.
 *
 * @param {number} noteId
 * @returns {Promise<Array>}
 */
async function listByNote(noteId) {
  const [rows] = await db.execute(
    'SELECT * FROM attachments WHERE note_id = ? ORDER BY created_at DESC',
    [noteId]
  );
  return rows;
}

/**
 * Elenca tutti gli allegati associati a un task.
 *
 * @param {number} taskId
 * @returns {Promise<Array>}
 */
async function listByTask(taskId) {
  const [rows] = await db.execute(
    'SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC',
    [taskId]
  );
  return rows;
}

/**
 * Rimuove un allegato dal database.
 *
 * @param {number} id
 * @returns {Promise<boolean>} true se eliminato
 */
async function removeById(id) {
  const [res] = await db.execute(
    'DELETE FROM attachments WHERE id = ?',
    [id]
  );
  return res.affectedRows > 0;
}

module.exports = {
  createAttachment,
  findById,
  listByNote,
  listByTask,
  removeById,
};
