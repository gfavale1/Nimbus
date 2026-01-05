/**
 * Controller HTTP per la gestione dello storico delle note.
 * Consente la consultazione delle versioni precedenti e il ripristino.
 */

const NoteHistory = require("../models/NoteHistory");
const Share = require("../models/Share");

// GET /api/notes/:id/history
async function getHistoryByNote(req, res, next) {
  try {
    const noteId = Number(req.params.id);
    const userId = req.user.dbId;

    console.log("[HISTORY] noteId:", noteId);
    console.log("[HISTORY] userId:", userId);

    const isOwner = await Share.isNoteOwner(userId, noteId);
    console.log("[HISTORY] isOwner:", isOwner);

    const canView = await Share.canView(userId, noteId);
    console.log("[HISTORY] canView:", canView);

    if (!isOwner && !canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const rows = await NoteHistory.findByNoteId(noteId);

    console.log(
      "[HISTORY] rows type:",
      Array.isArray(rows),
      rows
    );
    // Trasforma i dati in stringhe semplici (JSON puro)
    // Questo assicura che le date diventino stringhe ISO e non oggetti Date complessi
    const dataToSendMessage = JSON.parse(JSON.stringify(rows));

    res.status(200).json(dataToSendMessage);
  } catch (err) {
    next(err);
  }
}

// GET /api/notes/history/:hid
async function getHistoryVersion(req, res, next) {
  try {
    const historyId = Number(req.params.hid);
    if (!historyId) {
      return res.status(400).json({ message: "historyId non valido" });
    }

    const version = await NoteHistory.findById(historyId);
    if (!version) {
      return res.status(404).json({ message: "Versione non trovata" });
    }

    res.json(version[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/notes/:id/history/:hid/restore
async function restoreNoteVersion(req, res, next) {
  try {
    const noteId = Number(req.params.id);
    const historyId = Number(req.params.hid);

    if (!noteId || !historyId) {
      return res.status(400).json({ message: "Parametri non validi" });
    }

    const canEdit = await Share.isNoteOwner(req.user.dbId, noteId);
    if (!canEdit) {
      return res.status(403).json({ message: "Only owner can restore" });
    }

    const version = await NoteHistory.findById(historyId);
    if (!version) {
      return res.status(404).json({ message: "Versione non trovata" });
    }

    await NoteHistory.restoreVersion(noteId, version, req.user.dbId);

    res.status(200).json({ status: "success" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHistoryByNote,
  getHistoryVersion,
  restoreNoteVersion
};
