const express = require("express");
const multer = require("multer");

const requireUser = require("../middleware/requireUser");
const {
  uploadNoteAttachment,
  listNoteAttachments,
  deleteAttachment
} = require("../controllers/attachmentController");

const router = express.Router();

// Upload in memoria (usato per Azure Blob Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// Upload allegato a una nota (owner / editor)
router.post(
  "/notes/:noteId/attachments",
  requireUser,
  upload.single("file"),
  uploadNoteAttachment
);

// Lista allegati di una nota (viewer / editor / owner)
router.get(
  "/notes/:noteId/attachments",
  requireUser,
  listNoteAttachments
);

// Eliminazione allegato (owner / editor)
router.delete(
  "/attachments/:attachmentId",
  requireUser,
  deleteAttachment
);

module.exports = router;
