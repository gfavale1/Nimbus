/**
 * Controller HTTP per la gestione dei task.
 * Espone endpoint REST per CRUD dei task personali.
 * La logica applicativa e le notifiche sono demandate ai services.
 */

const Tasks = require("../models/Task");
const {
  notifyTaskCreated,
  notifyTaskUpdated,
  notifyTaskDeleted
} = require("../services/notifyService");

/**
 * Normalizza una data in formato MySQL DATETIME.
 * NB = non dovrebbe stare qua ma non ha senso per me creare una cartella utils solo con questa funzione
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// GET /api/tasks
async function listTasks(req, res, next) {
  try {
    const userId = req.user.dbId;
    const data = await Tasks.findAllByUser(userId);
    const total = await Tasks.countByUser(userId);
    res.json({ data, total });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id
async function getTask(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "id non valido" });
    }

    const task = await Tasks.findById(id);
    if (!task || task.user_id !== req.user.dbId) {
      return res.status(404).json({ message: "Task non trovato" });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks
async function create(req, res, next) {
  try {
    const user = req.user;

    const task = await Tasks.create({
      user_id: user.dbId,
      ...req.body,
      due_date: normalizeDate(req.body.due_date),
    });

    await notifyTaskCreated(task, user);

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "id non valido" });
    }

    const user = req.user;
    const task = await Tasks.findById(id);
    if (!task || task.user_id !== user.dbId) {
      return res.status(404).json({ message: "Task non trovato" });
    }

    const updated = await Tasks.update(id, {
      ...req.body,
      due_date: normalizeDate(req.body.due_date),
    });

    await notifyTaskUpdated(updated, user);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "id non valido" });
    }

    const user = req.user;
    const task = await Tasks.findById(id);
    if (!task || task.user_id !== user.dbId) {
      return res.status(404).json({ message: "Task non trovato" });
    }

    await notifyTaskDeleted(task, user);

    const out = await Tasks.remove(id);
    res.json(out);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  getTask,
  create,
  update,
  remove
};
