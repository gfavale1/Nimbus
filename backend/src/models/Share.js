/**
 * Model: Share
 *
 * Gestisce l'accesso ai dati relativi alla condivisione delle note (`note_shares`).
 * Include utility basate su query SQL per verificare i permessi (owner/viewer/editor).
 */

const db = require('../config/db');

/**
 * Verifica se l'utente è proprietario della nota.
 *
 * @param {number} userId
 * @param {number} noteId
 * @returns {Promise<boolean>}
 */
async function isNoteOwner(userId, noteId) {
  const [rows] = await db.query(
    'SELECT 1 FROM notes WHERE id = ? AND user_id = ? LIMIT 1',
    [noteId, userId]
  );
  return rows.length > 0;
}

/**
 * Recupera il record di condivisione per un utente e una nota.
 *
 * @param {number} userId
 * @param {number} noteId
 * @returns {Promise<{role: string}|null>}
 */
async function userShareRecord(userId, noteId) {
  const [rows] = await db.query(
    'SELECT role FROM note_shares WHERE note_id = ? AND shared_with_user_id = ? LIMIT 1',
    [noteId, userId]
  );
  return rows[0] || null;
}

/**
 * Verifica se l'utente può visualizzare la nota.
 * Consentito a owner, viewer ed editor.
 *
 * @param {number} userId
 * @param {number} noteId
 * @returns {Promise<boolean>}
 */
async function canView(userId, noteId) {
  if (await isNoteOwner(userId, noteId)) return true;
  const rec = await userShareRecord(userId, noteId);
  return !!rec;
}

/**
 * Verifica se l'utente può modificare la nota.
 * Consentito a owner ed editor.
 *
 * @param {number} userId
 * @param {number} noteId
 * @returns {Promise<boolean>}
 */
async function canEdit(userId, noteId) {
  if (await isNoteOwner(userId, noteId)) return true;
  const rec = await userShareRecord(userId, noteId);
  return rec?.role === 'editor';
}

/**
 * Elenca tutte le condivisioni di una nota.
 *
 * @param {number} noteId
 * @returns {Promise<Array>}
 */
async function listSharesForNote(noteId) {
  const [rows] = await db.query(
    `SELECT
        ns.shared_with_user_id AS user_id,
        u.email,
        u.display_name,
        ns.role,
        ns.created_at
     FROM note_shares ns
     JOIN users u ON u.id = ns.shared_with_user_id
     WHERE ns.note_id = ?
     ORDER BY u.display_name ASC`,
    [noteId]
  );
  return rows;
}

/**
 * Restituisce tutte le note condivise con un utente.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listNotesSharedWithUser(userId) {
  const [rows] = await db.query(
    `SELECT
        n.id,                   
        n.id AS note_id, 
        n.title,
        n.content,
        n.user_id AS owner_id,
        n.created_at,           
        n.updated_at,           
        u.display_name AS owner_name,
        u.email AS owner_email,
        ns.role,
        ns.created_at AS shared_at,
        GROUP_CONCAT(t.name) AS tags
     FROM note_shares ns
     JOIN notes n ON n.id = ns.note_id
     JOIN users u ON u.id = n.user_id
     LEFT JOIN note_tags nt ON n.id = nt.note_id
     LEFT JOIN tags t ON nt.tag_id = t.id
     WHERE ns.shared_with_user_id = ?
     GROUP BY n.id, ns.role, u.display_name, u.email, ns.created_at
     ORDER BY n.updated_at DESC`, 
    [userId]
  );

  return rows.map(r => ({
    ...r,
    owner_name: r.owner_name || null,
    owner_email: r.owner_email || null,
  }));
}

/**
 * Aggiunge o aggiorna una condivisione.
 *
 * @param {number} noteId
 * @param {number} sharedWithUserId
 * @param {string} role - viewer | editor
 * @returns {Promise<Object>}
 */
async function addShare(noteId, sharedWithUserId, role = 'viewer') {
  await db.query(
    `INSERT INTO note_shares (note_id, shared_with_user_id, role)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [noteId, sharedWithUserId, role]
  );

  const [rows] = await db.query(
    `SELECT
        ns.shared_with_user_id AS user_id,
        u.email,
        u.display_name,
        ns.role,
        ns.created_at
     FROM note_shares ns
     JOIN users u ON u.id = ns.shared_with_user_id
     WHERE ns.note_id = ? AND ns.shared_with_user_id = ?`,
    [noteId, sharedWithUserId]
  );

  return rows[0];
}

/**
 * Aggiorna il ruolo di una condivisione.
 *
 * @param {number} noteId
 * @param {number} sharedWithUserId
 * @param {string} role
 * @returns {Promise<Object|null>}
 */
async function updateShare(noteId, sharedWithUserId, role) {
  await db.query(
    `UPDATE note_shares
     SET role = ?
     WHERE note_id = ? AND shared_with_user_id = ?`,
    [role, noteId, sharedWithUserId]
  );

  const [rows] = await db.query(
    `SELECT
        ns.shared_with_user_id AS user_id,
        u.email,
        u.display_name,
        ns.role,
        ns.created_at
     FROM note_shares ns
     JOIN users u ON u.id = ns.shared_with_user_id
     WHERE ns.note_id = ? AND ns.shared_with_user_id = ?`,
    [noteId, sharedWithUserId]
  );

  return rows[0] || null;
}

/**
 * Rimuove una condivisione.
 *
 * @param {number} noteId
 * @param {number} sharedWithUserId
 * @returns {Promise<{deleted: boolean}>}
 */
async function removeShare(noteId, sharedWithUserId) {
  await db.query(
    `DELETE FROM note_shares
     WHERE note_id = ? AND shared_with_user_id = ?`,
    [noteId, sharedWithUserId]
  );
  return { deleted: true };
}

module.exports = {
  isNoteOwner,
  canView,
  canEdit,
  listSharesForNote,
  listNotesSharedWithUser,
  addShare,
  updateShare,
  removeShare,
};
