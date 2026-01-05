/**
 * Model: User
 *
 * Gestisce l'accesso ai dati di `users`.
 * Contiene funzioni per la lettura, creazione, aggiornamento ed eliminazione degli utenti.
 */

const db = require('../config/db');

module.exports = {

  /**
   * Recupera tutti gli utenti.
   *
   * @returns {Promise<Array>} Lista di utenti
   */
  async findAll() {
    const [rows] = await db.query(
      'SELECT id, email, display_name, created_at, updated_at FROM users ORDER BY id DESC'
    );
    return rows;
  },

  /**
   * Recupera un utente per ID.
   *
   * @param {number} id - ID dell'utente
   * @returns {Promise<Object|null>} Utente trovato o null
   */
  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, email, display_name, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Recupera un utente per email.
   *
   * @param {string} email - Email dell'utente
   * @returns {Promise<Object|null>} Utente trovato o null
   */
  async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT id, email, display_name FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Crea un nuovo utente.
   *
   * @param {Object} data
   * @param {string} data.email - Email dell'utente
   * @param {string} data.display_name - Nome visualizzato
   * @returns {Promise<Object>} Utente creato
   */
  async create({ email, display_name }) {
    const [res] = await db.query(
      'INSERT INTO users (email, display_name) VALUES (?, ?)',
      [email, display_name]
    );
    return this.findById(res.insertId);
  },

  /**
   * Aggiorna il nome visualizzato di un utente.
   *
   * @param {number} id - ID dell'utente
   * @param {Object} data
   * @param {string} data.display_name - Nuovo nome visualizzato
   * @returns {Promise<Object|null>} Utente aggiornato
   */
  async update(id, { display_name }) {
    await db.query(
      'UPDATE users SET display_name = ? WHERE id = ?',
      [display_name, id]
    );
    return this.findById(id);
  },

  /**
   * Elimina un utente.
   *
   * @param {number} id - ID dell'utente
   * @returns {Promise<{deleted: boolean}>}
   */
  async remove(id) {
    await db.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return { deleted: true };
  },
  
};
