/**
 * Model: NoteTag
 *
 * Gestisce la relazione many-to-many tra Note e Tag
 * tramite la tabella `note_tags`.
 * - recupera i tag associati a una nota
 * - aggiunge uno o più tag a una nota
 * - rimuove o sostituisce completamente i tag di una nota
 */

const db = require('../config/db');

module.exports = {

  /**
   * Restituisce l'elenco dei tag associati a una nota.
   *
   * @param {number} noteId - ID della nota
   * @returns {Promise<Array<{id:number, name:string}>>}
   */
  async getTagsForNote(noteId) {
    const [rows] = await db.query(
      `SELECT t.id, t.name
       FROM note_tags nt
       JOIN tags t ON t.id = nt.tag_id
       WHERE nt.note_id = ?
       ORDER BY t.name ASC`,
      [noteId]
    );
    return rows;
  },

  /**
   * Aggiunge uno o più tag a una nota senza rimuovere quelli esistenti.
   * I duplicati vengono ignorati (INSERT IGNORE).
   *
   * @param {number} noteId - ID della nota
   * @param {number[]} tagIds - Array di ID dei tag
   * @returns {Promise<void>}
   */
  async addTagIds(noteId, tagIds = []) {
    if (!tagIds.length) return;
    const values = tagIds.map(id => [noteId, id]);
    await db.query(
      'INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES ?',
      [values]
    );
  },

  /**
   * Rimuove un singolo tag da una nota.
   *
   * @param {number} noteId - ID della nota
   * @param {number} tagId - ID del tag
   * @returns {{deleted: boolean}}
   */
  async removeTagId(noteId, tagId) {
    await db.query(
      'DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?',
      [noteId, tagId]
    );
    return { deleted: true };
  },

  /**
   * Sostituisce completamente i tag associati a una nota.
   * Operazione atomica (transaction):
   * - cancella tutti i tag esistenti
   * - inserisce il nuovo insieme
   *
   * @param {number} noteId - ID della nota
   * @param {number[]} tagIds - Nuovo insieme di ID tag
   * @returns {Promise<Array<{id:number, name:string}>>}
   */
  async replaceTagIds(noteId, tagIds = []) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        'DELETE FROM note_tags WHERE note_id = ?',
        [noteId]
      );

      if (tagIds.length) {
        const values = tagIds.map(id => [noteId, id]);
        await conn.query(
          'INSERT INTO note_tags (note_id, tag_id) VALUES ?',
          [values]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return this.getTagsForNote(noteId);
  },
};
