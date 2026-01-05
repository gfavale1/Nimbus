/**
 * NoteTag Controller
 * Gestisce l’associazione tra note e tag.
 * I permessi sono verificati tramite permissionService.
 */

const Tags = require('../models/Tag');
const NoteTag = require('../models/NoteTag');
const { ensureNoteRole } = require('../services/permissionService');

//GET /api/notes/:noteId/tags
exports.getTagsForNote = async (req, res, next) => {
  try {
    const noteId = Number(req.params.noteId);
    const userId = req.user.dbId;

    if (!noteId) {
      return res.status(400).json({ message: 'noteId non valido' });
    }

    await ensureNoteRole(noteId, userId, 'viewer');

    const tags = await NoteTag.getTagsForNote(noteId);
    res.json(tags);
  } catch (err) {
    next(err);
  }
};

//POST /api/notes/:noteId/tags
exports.addTags = async (req, res, next) => {
  try {
    const noteId = Number(req.params.noteId);
    const userId = req.user.dbId;

    if (!noteId) {
      return res.status(400).json({ message: 'noteId non valido' });
    }

    await ensureNoteRole(noteId, userId, 'editor');

    const { names = [], tagIds = [] } = req.body;

    const createdIds = [];
    for (const raw of names) {
      const name = (raw || '').trim().toLowerCase();
      if (!name) continue;
      const t = await Tags.create({ name });
      createdIds.push(t.id);
    }

    const allIds = [...tagIds, ...createdIds].filter(Boolean);
    await NoteTag.addTagIds(noteId, allIds);

    const out = await NoteTag.getTagsForNote(noteId);
    res.status(201).json(out);
  } catch (err) {
    next(err);
  }
};

//PUT /api/notes/:noteId/tags
exports.replaceTags = async (req, res, next) => {
  try {
    const noteId = Number(req.params.noteId);
    const userId = req.user.dbId;

    if (!noteId) {
      return res.status(400).json({ message: 'noteId non valido' });
    }

    await ensureNoteRole(noteId, userId, 'editor');

    const { names = [], tagIds = [] } = req.body;

    const createdIds = [];
    for (const raw of names) {
      const name = (raw || '').trim().toLowerCase();
      if (!name) continue;
      const t = await Tags.create({ name });
      createdIds.push(t.id);
    }

    const allIds = [...tagIds, ...createdIds].filter(Boolean);
    const out = await NoteTag.replaceTagIds(noteId, allIds);

    res.json(out);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notes/:noteId/tags/:tagId
exports.removeTag = async (req, res, next) => {
  try {
    const noteId = Number(req.params.noteId);
    const tagId = Number(req.params.tagId);
    const userId = req.user.dbId;

    if (!noteId || !tagId) {
      return res.status(400).json({ message: 'Parametri non validi' });
    }

    await ensureNoteRole(noteId, userId, 'editor');

    const out = await NoteTag.removeTagId(noteId, tagId);
    res.json(out);
  } catch (err) {
    next(err);
  }
};
