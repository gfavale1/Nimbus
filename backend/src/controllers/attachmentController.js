/**
 * Attachment Controller
 * Gestisce il caricamento, la lettura e la rimozione degli allegati associati alle note.
 * L’accesso ai dati è delegato al model Attachment e ai service Blob e Permission.
 */

const Attachment = require("../models/Attachment");
const {
  uploadAttachment,
  deleteAttachmentBlob,
  generateReadSasUrl
} = require("../services/blobService");
const { ensureNoteRole } = require("../services/permissionService");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/notes/:noteId/attachments
 */
async function uploadNoteAttachment(req, res, next) {
  try {
    const userId = req.user.dbId;
    const noteId = Number(req.params.noteId);

    if (!req.file) {
      return res.status(400).json({ error: "File mancante" });
    }

    if (req.file.size > MAX_SIZE) {
      return res.status(413).json({ error: "File troppo grande (max 10 MB)" });
    }

    await ensureNoteRole(noteId, userId, "editor");

    const { buffer, mimetype, originalname } = req.file;

    const blobMeta = await uploadAttachment({
      buffer,
      contentType: mimetype,
      originalName: originalname,
      noteId,
      userId
    });

    await Attachment.createAttachment({
      note_id: noteId,
      uploader_id: userId,
      blob_name: blobMeta.blobName,
      file_name: blobMeta.fileName,
      content_type: blobMeta.contentType,
      size: blobMeta.size,
      etag: blobMeta.etag
    });

    res.status(201).json({
      file_name: blobMeta.fileName,
      size: blobMeta.size
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes/:noteId/attachments
 */
async function listNoteAttachments(req, res, next) {
  try {
    const userId = req.user.dbId;
    const noteId = Number(req.params.noteId);

    await ensureNoteRole(noteId, userId, "viewer");

    const rows = await Attachment.listByNote(noteId);

    const result = await Promise.all(
      rows.map(async (att) => ({
        id: att.id,
        file_name: att.file_name,
        sas_url: await generateReadSasUrl(att.blob_name, 15)
      }))
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/attachments/:attachmentId
 */
async function deleteAttachment(req, res, next) {
  try {
    const userId = req.user.dbId;
    const attachmentId = Number(req.params.attachmentId);

    const attachment = await Attachment.findById(attachmentId);

    if (!attachment) {
      return res.status(404).json({ error: "Allegato non trovato" });
    }

    await ensureNoteRole(attachment.note_id, userId, "editor");

    await deleteAttachmentBlob(attachment.blob_name);
    await Attachment.removeById(attachmentId);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadNoteAttachment,
  listNoteAttachments,
  deleteAttachment
};
