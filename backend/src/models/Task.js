/**
 * Model: Task
 *
 * Gestisce l'accesso ai dati della tabella `tasks`.
 * Fornisce funzioni di lettura, creazione, aggiornamento ed eliminazione
 * delle attività associate a un utente.
 */

const db = require('../config/db');

/**
 * Costruisce il WHERE per le query sui task.
 *
 * @param {Object} filters - Filtri applicabili
 * @param {Array} values - Array dei valori da bindare alla query
 * @returns {string} Clausola WHERE SQL
 */
function buildWhere(filters, values) {
  const where = ['user_id = ?'];
  values.push(filters.userId);

  if (filters.status) {
    where.push('status = ?');
    values.push(filters.status);
  }

  if (filters.priority) {
    where.push('priority = ?');
    values.push(filters.priority);
  }

  if (filters.q) {
    where.push('(title LIKE ? OR description LIKE ?)');
    values.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  if (filters.dueFrom) {
    where.push('due_date >= ?');
    values.push(filters.dueFrom);
  }

  if (filters.dueTo) {
    where.push('due_date <= ?');
    values.push(filters.dueTo);
  }

  return where.length ? `WHERE ${where.join(' AND ')}` : '';
}

module.exports = {

  /**
   * Recupera i task di un utente con filtri opzionali e paginazione.
   *
   * @param {number} userId - ID dell'utente
   * @param {Object} filters - Filtri opzionali
   * @param {string=} filters.status
   * @param {string=} filters.priority
   * @param {string=} filters.q - Ricerca testuale su titolo/descrizione
   * @param {string=} filters.dueFrom - Data minima di scadenza
   * @param {string=} filters.dueTo - Data massima di scadenza
   * @param {number=} filters.limit - Numero massimo di risultati
   * @param {number=} filters.offset - Offset per la paginazione
   * @returns {Promise<Array>} Lista di task
   */
  async findAllByUser(
    userId,
    { status, priority, q, dueFrom, dueTo, limit = 50, offset = 0 } = {}
  ) {
    const values = [];
    const where = buildWhere({ userId, status, priority, q, dueFrom, dueTo }, values);

    const [rows] = await db.query(
      `SELECT id, user_id, title, description, priority, due_date, status, created_at, updated_at
       FROM tasks
       ${where}
       ORDER BY due_date IS NULL, due_date ASC, id DESC
       LIMIT ? OFFSET ?`,
      [...values, Number(limit), Number(offset)]
    );

    return rows;
  },

  /**
   * Conta il numero totale di task di un utente con filtri opzionali.
   *
   * @param {number} userId - ID dell'utente
   * @param {Object} filters - Filtri opzionali
   * @returns {Promise<number>} Numero totale di task
   */
  async countByUser(userId, { status, priority, q, dueFrom, dueTo } = {}) {
    const values = [];
    const where = buildWhere({ userId, status, priority, q, dueFrom, dueTo }, values);

    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM tasks ${where}`,
      values
    );

    return rows[0]?.total ?? 0;
  },

  /**
   * Recupera un task per ID.
   *
   * @param {number} id - ID del task
   * @returns {Promise<Object|null>} Task trovato o null
   */
  async findById(id) {
    const [rows] = await db.query(
      `SELECT id, user_id, title, description, priority, due_date, status, created_at, updated_at
       FROM tasks
       WHERE id = ?`,
      [id]
    );

    return rows[0] || null;
  },

  /**
   * Crea un nuovo task.
   *
   * @param {Object} data
   * @param {number} data.user_id - ID dell'utente
   * @param {string} data.title - Titolo del task
   * @param {string=} data.description - Descrizione opzionale
   * @param {string=} data.priority - Priorità (default: medium)
   * @param {string=} data.due_date - Data di scadenza
   * @param {string=} data.status - Stato (default: todo)
   * @returns {Promise<Object>} Task creato
   */
  async create({ user_id, title, description, priority, due_date, status }) {
    const [res] = await db.query(
      `INSERT INTO tasks (user_id, title, description, priority, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        title,
        description || null,
        priority || 'medium',
        due_date || null,
        status || 'todo',
      ]
    );

    return this.findById(res.insertId);
  },

  /**
   * Aggiorna un task esistente.
   *
   * @param {number} id - ID del task
   * @param {Object} patch - Campi da aggiornare
   * @returns {Promise<Object|null>} Task aggiornato o null se non trovato
   */
  async update(id, patch) {
    const current = await this.findById(id);
    if (!current) return null;

    const {
      title = current.title,
      description = current.description,
      priority = current.priority,
      due_date = current.due_date,
      status = current.status,
    } = patch;

    await db.query(
      `UPDATE tasks
       SET title = ?, description = ?, priority = ?, due_date = ?, status = ?
       WHERE id = ?`,
      [title, description || null, priority, due_date || null, status, id]
    );

    return this.findById(id);
  },

  /**
   * Elimina un task.
   *
   * @param {number} id - ID del task
   * @returns {Promise<{deleted: boolean}>}
   */
  async remove(id) {
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    return { deleted: true };
  },
};
