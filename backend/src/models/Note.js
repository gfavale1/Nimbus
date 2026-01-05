/**
 * Model: Note
 *
 * Gestisce l'accesso ai dati della tabella `notes` e delle entità collegate
 * (tag, storico versioni).
 * Ha solo query SQL e mapping verso oggetti JavaScript.
 */

const db = require('../config/db');

module.exports = {

  /**
   * Recupera tutte le note di un utente, includendo i tag associati.
   *
   * @param {number} userId - ID dell'utente proprietario
   * @returns {Promise<Array>} Lista di note con campo `tags`
   */
  async findAllByUser(userId) {
    const [rows] = await db.query(
      `SELECT n.*, GROUP_CONCAT(t.name) AS tags
       FROM notes n
       LEFT JOIN note_tags nt ON n.id = nt.note_id
       LEFT JOIN tags t ON nt.tag_id = t.id
       WHERE n.user_id = ?
       GROUP BY n.id
       ORDER BY n.updated_at DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Recupera una singola nota per ID, includendo i tag associati.
   *
   * @param {number} id - ID della nota
   * @returns {Promise<Object|null>} Nota trovata o null
   */
  async findById(id) {
    const [rows] = await db.query(
      `SELECT n.*, GROUP_CONCAT(t.name) AS tags
       FROM notes n
       LEFT JOIN note_tags nt ON n.id = nt.note_id
       LEFT JOIN tags t ON nt.tag_id = t.id
       WHERE n.id = ?
       GROUP BY n.id`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Crea una nuova nota.
   *
   * @param {Object} data
   * @param {number} data.user_id - ID dell'utente proprietario
   * @param {string} data.title - Titolo della nota
   * @param {string|null} data.content - Contenuto opzionale
   * @returns {Promise<Object>} Nota creata
   */
  async create({ user_id, title, content }) {
    const [res] = await db.query(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [user_id, title, content || null]
    );
    return this.findById(res.insertId);
  },

  /**
   * Aggiorna una nota e salva la versione precedente nello storico.
   * Mantiene al massimo 10 versioni per nota.
   *
   * @param {number} id - ID della nota
   * @param {Object} data - Campi aggiornabili
   * @param {string=} data.title
   * @param {string=} data.content
   * @param {number} userId - ID dell'utente che effettua la modifica
   * @returns {Promise<Object|null>} Esito dell'aggiornamento o null se non trovata
   */
  async update(id, { title, content }, userId) {
    const current = await this.findById(id);
    if (!current) return null;

    // Salvataggio versione precedente
    await db.query(
      'INSERT INTO note_history (note_id, user_id, title, content, modified_at) VALUES (?, ?, ?, ?, NOW())',
      [id, userId, current.title, current.content]
    );

    // Mantiene solo le ultime 10 versioni
    await db.query(
      `DELETE FROM note_history
       WHERE note_id = ?
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM note_history
           WHERE note_id = ?
           ORDER BY modified_at DESC
           LIMIT 10
         ) AS tmp
       )`,
      [id, id]
    );

    const newTitle = title != null ? title : current.title;
    const newContent = content != null ? content : current.content;

    await db.query(
      'UPDATE notes SET title = ?, content = ? WHERE id = ?',
      [newTitle, newContent, id]
    );

    return { id, title: newTitle, content: newContent, updated: true };
  },

  /**
   * Recupera tutte le note di un utente con relativi allegati.
   *
   * @param {number} userId - ID dell'utente
   * @returns {Promise<Array>} Note con campo `attachments`
   */
  async getAllNotesWithAttachments(userId) {
    const cacheBusterComment = `/* ${Date.now()} */`;

    const [notes] = await db.execute(
      `${cacheBusterComment}
       SELECT n.*, GROUP_CONCAT(t.name) AS tags
       FROM notes n
       LEFT JOIN note_tags nt ON n.id = nt.note_id
       LEFT JOIN tags t ON nt.tag_id = t.id
       WHERE n.user_id = ?
       GROUP BY n.id
       ORDER BY n.updated_at DESC`,
      [userId]
    );

    for (const note of notes) {
      const [attachments] = await db.execute(
        `${cacheBusterComment}
         SELECT id, file_name, sas_url
         FROM attachments
         WHERE note_id = ?`,
        [note.id]
      );
      note.attachments = attachments;
    }

    return notes;
  },
};
