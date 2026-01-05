/**
 * Model: Tag
 *
 * Gestisce l'accesso ai dati della tabella `tags`.
 * Fornisce funzioni per la creazione, ricerca, aggiornamento
 * ed eliminazione dei tag.
 */

const db = require('../config/db');

module.exports = {

  /**
   * Restituisce la lista dei tag con filtro opzionale e paginazione.
   *
   * @param {Object} options
   * @param {string=} options.q - Filtro testuale sul nome del tag
   * @param {number=} options.limit - Numero massimo di risultati
   * @param {number=} options.offset - Offset per la paginazione
   * @returns {Promise<Array>} Lista di tag
   */
  async list({ q, limit = 50, offset = 0 } = {}) {
    const params = [];
    let where = '';

    if (q) {
      where = 'WHERE name LIKE ?';
      params.push(`%${q}%`);
    }

    const [rows] = await db.query(
      `SELECT id, name, created_at
       FROM tags
       ${where}
       ORDER BY name ASC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return rows;
  },

  /**
   * Conta il numero totale di tag con filtro opzionale.
   *
   * @param {Object} options
   * @param {string=} options.q - Filtro testuale sul nome del tag
   * @returns {Promise<number>} Numero totale di tag
   */
  async count({ q } = {}) {
    const params = [];
    let where = '';

    if (q) {
      where = 'WHERE name LIKE ?';
      params.push(`%${q}%`);
    }

    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM tags ${where}`,
      params
    );

    return rows[0]?.total ?? 0;
  },

  /**
   * Recupera un tag per ID.
   *
   * @param {number} id - ID del tag
   * @returns {Promise<Object|null>} Tag trovato o null
   */
  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, name, created_at FROM tags WHERE id = ?',
      [id]
    );

    return rows[0] || null;
  },

  /**
   * Recupera un tag per nome.
   *
   * @param {string} name - Nome del tag
   * @returns {Promise<Object|null>} Tag trovato o null
   */
  async findByName(name) {
    const [rows] = await db.query(
      'SELECT id, name FROM tags WHERE name = ?',
      [name]
    );

    return rows[0] || null;
  },

  /**
   * Crea un nuovo tag (normalizzato in lowercase).
   * Se il tag esiste già, restituisce quello esistente.
   *
   * @param {Object} data
   * @param {string} data.name - Nome del tag
   * @returns {Promise<Object>} Tag creato o esistente
   */
  async create({ name }) {
    const norm = name.trim().toLowerCase();
    const existing = await this.findByName(norm);
    if (existing) return existing;

    const [res] = await db.query(
      'INSERT INTO tags (name) VALUES (?)',
      [norm]
    );

    return this.findById(res.insertId);
  },

  /**
   * Aggiorna il nome di un tag.
   *
   * @param {number} id - ID del tag
   * @param {Object} data
   * @param {string} data.name - Nuovo nome del tag
   * @returns {Promise<Object|null>} Tag aggiornato
   */
  async update(id, { name }) {
    const norm = name.trim().toLowerCase();

    await db.query(
      'UPDATE tags SET name = ? WHERE id = ?',
      [norm, id]
    );

    return this.findById(id);
  },

  /**
   * Elimina un tag.
   *
   * @param {number} id - ID del tag
   * @returns {Promise<{deleted: boolean}>}
   */
  async remove(id) {
    await db.query(
      'DELETE FROM tags WHERE id = ?',
      [id]
    );

    return { deleted: true };
  },
};
