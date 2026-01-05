/**
 * Restituisce una panoramica della dashboard per un utente.
 *
 * Include:
 * - numero totale di note
 * - task aperti e completati
 * - task scaduti
 * - note aggiornate di recente
 * - allegati caricati di recente (note e task)
 *
 * NB = Tutti i dati sono filtrati per userId.
 */

const db = require("../config/db");

/**
 * Ritorna i dati di dashboard per un utente
 */
async function getDashboardOverview(userId) {
  // Conteggio note
  const [[noteCount]] = await db.query(
    `SELECT COUNT(*) AS notes FROM notes WHERE user_id = ?`,
    [userId]
  );

  // Conteggio task
  const [[taskCount]] = await db.query(
    `SELECT
       SUM(CASE WHEN status IN ('todo','in_progress') THEN 1 ELSE 0 END) AS open_tasks,
       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)                 AS done_tasks
     FROM tasks
     WHERE user_id = ?`,
    [userId]
  );

  // Task scaduti
  const [overdueTasks] = await db.query(
    `SELECT id, title, due_date, priority, status
       FROM tasks
      WHERE user_id = ?
        AND status IN ('todo','in_progress')
        AND due_date IS NOT NULL
        AND due_date < NOW()
      ORDER BY due_date ASC
      LIMIT 10`,
    [userId]
  );

  // Note recenti
  const [recentNotes] = await db.query(
    `SELECT id, title, updated_at
       FROM notes
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 10`,
    [userId]
  );

  // Allegati recenti
  const [recentAttachments] = await db.query(
    `SELECT a.id, a.file_name, a.content_type, a.size, a.created_at, a.note_id, a.task_id
       FROM attachments a
       LEFT JOIN notes n ON a.note_id = n.id
       LEFT JOIN tasks t ON a.task_id = t.id
      WHERE n.user_id = ? OR t.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT 10`,
    [userId, userId]
  );

  return {
    notes: Number(noteCount?.notes ?? 0),
    tasks: {
      open: Number(taskCount?.open_tasks ?? 0),
      done: Number(taskCount?.done_tasks ?? 0),
    },
    overdueTasks,
    recentNotes,
    recentAttachments,
  };
}

module.exports = {
  getDashboardOverview
};
