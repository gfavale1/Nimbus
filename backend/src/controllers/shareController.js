/**
 * Controller HTTP per la gestione delle condivisioni delle note.
 * Gestisce la visualizzazione, aggiunta, modifica e rimozione
 * dei permessi di accesso alle note condivise.
 *
 * Le operazioni sono consentite solo al proprietario della nota.
 */

const Share = require("../models/Share");
const Users = require("../models/User");
const Note = require("../models/Note");

const {
  notifyNoteShared,
  notifyNoteUpdated
} = require("../services/notifyService");

// GET /api/notes/:noteId/shares
async function listForNote(req, res, next) {
  try {
    const noteId = Number(req.params.noteId);
    if (!noteId) {
      return res.status(400).json({ message: "noteId non valido" });
    }

    const canView = await Share.canView(req.user.dbId, noteId);
    if (!canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const items = await Share.listSharesForNote(noteId);
    res.json(items);
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

// POST /api/notes/:noteId/shares
async function add(req, res, next) {
  try {
    const noteId = Number(req.params.noteId);
    if (!noteId) {
      return res.status(400).json({ message: "noteId non valido" });
    }

    const isOwner = await Share.isNoteOwner(req.user.dbId, noteId);
    if (!isOwner) {
      return res.status(403).json({ message: "Not owner" });
    }

    const { user_id, role } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id richiesto" });
    }

    const target = await Users.findById(user_id);
    if (!target) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    await Share.addShare(noteId, user_id, role);

    // Recuperiamo la nota per il contenuto della notifica
    const note = await Note.findById(noteId);
    const owner = req.user;

    // Notifica all'utente con cui la nota è stata condivisa
    await notifyNoteShared(
      note,
      target,
      owner.display_name || owner.email
    );

    res.status(201).json({
      user_id: target.id,
      role,
      email: target.email,
      display_name: target.display_name,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/notes/:noteId/shares/:userId
async function update(req, res, next) {
  try {
    const noteId = Number(req.params.noteId);
    const userId = Number(req.params.userId);

    if (!noteId || !userId) {
      return res.status(400).json({ message: "Parametri non validi" });
    }

    const isOwner = await Share.isNoteOwner(req.user.dbId, noteId);
    if (!isOwner) {
      return res.status(403).json({ message: "Not owner" });
    }

    const { role } = req.body;

    const out = await Share.updateShare(noteId, userId, role);
    if (!out) {
      return res.status(404).json({ message: "Share not found" });
    }

    const note = await Note.findById(noteId);

    // Notifica modifica permessi (riuso intenzionale)
    await notifyNoteUpdated(note.id, note.title);

    res.json(out);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notes/:noteId/shares/:userId
async function remove(req, res, next) {
  try {
    const noteId = Number(req.params.noteId);
    const targetUserId = Number(req.params.userId);

    if (!noteId || !targetUserId) {
      return res.status(400).json({ message: "Parametri non validi" });
    }

    const isOwner = await Share.isNoteOwner(req.user.dbId, noteId);
    if (!isOwner) {
      return res.status(403).json({ message: "Not owner" });
    }

    const note = await Note.findById(noteId);
    const targetUser = await Users.findById(targetUserId);

    await Share.removeShare(noteId, targetUserId);

    // Notifica revoca accesso (riuso intenzionale)
    if (note && targetUser) {
      await notifyNoteUpdated(note.id, `${note.title} (Accesso revocato)`);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listForNote,
  listSharedWithMe,
  add,
  update,
  remove
};
