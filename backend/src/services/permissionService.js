/**
 * permissionService
 *
 * Service per la gestione dei permessi sulle note.
 * Incapsula la logica di autorizzazione basata su:
 *  - proprietà della nota (owner)
 *  - condivisioni (note_shares)
 *
 * Viene utilizzato da controller e service per evitare la duplicazione di controlli di sicurezza.
 */

const db = require("../config/db");

/**
 * Ordine gerarchico dei ruoli.
 * Usato per confrontare permessi minimi richiesti.
 */
const ROLE_ORDER = {
  viewer: 1,
  editor: 2,
  owner: 3
};

/**
 * Determina il ruolo dell'utente su una nota.
 *
 * Ritorna uno dei seguenti valori:
 *  - "owner"  → proprietario della nota
 *  - "editor" → utente con permesso di modifica
 *  - "viewer" → utente con solo permesso di lettura
 *  - null     → nessun accesso
 *
 * @param {number} noteId - ID della nota
 * @param {number} userId - ID dell'utente
 * @returns {Promise<string|null>}
 */
async function getNoteRole(noteId, userId) {
  // 1️Controllo proprietà (owner)
  const [notes] = await db.query(
    `SELECT user_id FROM notes WHERE id = ? LIMIT 1`,
    [noteId]
  );

  if (!notes.length) return null;

  if (notes[0].user_id === userId) {
    return "owner";
  }

  // 2️Controllo condivisione
  const [shares] = await db.query(
    `
    SELECT role
    FROM note_shares
    WHERE note_id = ? AND shared_with_user_id = ?
    LIMIT 1
    `,
    [noteId, userId]
  );

  if (shares.length) {
    return shares[0].role;
  }

  // Nessssun accesso
  return null;
}

/**
 * Verifica che l'utente possieda almeno il ruolo richiesto.
 *
 * Se il controllo fallisce, lancia un errore 403 che è intercettabile dall'errorHandler globale.
 *
 * @param {number} noteId - ID della nota
 * @param {number} userId - ID dell'utente
 * @param {"viewer"|"editor"|"owner"} minRole - Ruolo minimo richiesto
 * @returns {Promise<string>} ruolo effettivo dell'utente
 */
async function ensureNoteRole(noteId, userId, minRole = "viewer") {
  const role = await getNoteRole(noteId, userId);

  if (!role || ROLE_ORDER[role] < ROLE_ORDER[minRole]) {
    const err = new Error("Permesso negato");
    err.status = 403;
    throw err;
  }

  return role;
}

module.exports = {
  getNoteRole,
  ensureNoteRole
};
