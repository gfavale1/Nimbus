/**
 * Controller HTTP per la gestione delle note.
 * Espone endpoint REST per CRUD e visualizzazione delle note.
 * La logica di business e i controlli di accesso sono demandati
 * ai model e ai service dedicati.
 */

const Notes = require("../models/Note");
const Share = require("../models/Share");

const {
  notifyNoteCreated,
  notifyNoteUpdated,
  notifyNoteDeleted
} = require("../services/notifyService");

// GET /api/notes
async function listNotes(req, res, next) {
  try {
    const userId = req.user.dbId;
    const rows = await Notes.findAllByUser(userId);
    res.json(rows || []);
  } catch (err) {
    next(err);
  }
}

// GET /api/notes/shared/me
async function listSharedWithMe(req, res, next) {
  try {
    const items = await Share.listNotesSharedWithUser(req.user.dbId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

// GET /api/notes/:id
async function getNote(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "id non valido" });
    }

    const canView = await Share.canView(req.user.dbId, id);
    if (!canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const note = await Notes.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    next(err);
  }
}

// POST /api/notes
async function create(req, res, next) {
  try {
    const user = req.user;
    const { title, content } = req.body || {};

    if (!title) {
      return res.status(400).json({ message: "Title obbligatorio" });
    }

    const note = await Notes.create({
      user_id: user.dbId,
      title,
      content
    });

    await notifyNoteCreated(note, user);

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

// PUT /api/notes/:id
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { title, content } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: "id non valido" });
    }

    // I controlli di autorizzazione sono gestiti a livello di model/service -- scelta di architetura
    const updated = await Notes.update(id, { title, content }, req.user.dbId);

    if (!updated) {
      return res.status(404).json({ message: "Nota non trovata" });
    }

    await notifyNoteUpdated(id, updated.title);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notes/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const user = req.user;

    if (!id) {
      return res.status(400).json({ message: "id non valido" });
    }

    const isOwner = await Share.isNoteOwner(user.dbId, id);
    if (!isOwner) {
      return res.status(403).json({ message: "Only owner can delete" });
    }

    const note = await Notes.findById(id);

    await notifyNoteDeleted(note, user);

    const out = await Notes.remove(id);
    res.json(out);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotes,
  listSharedWithMe,
  getNote,
  create,
  update,
  remove
};
