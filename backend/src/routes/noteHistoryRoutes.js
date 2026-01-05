const express = require("express");
const router = express.Router();

const {
  getHistoryByNote,
  getHistoryVersion,
  restoreNoteVersion
} = require("../controllers/noteHistoryController");

const requireUser = require("../middleware/requireUser");

// Lista versioni di una nota
router.get("/:id/history", requireUser, getHistoryByNote);

// Dettaglio singola versione
router.get("/history/:hid", requireUser, getHistoryVersion);

// Ripristino versione precedente della nota
router.post("/:id/restore/:hid", requireUser, restoreNoteVersion);

module.exports = router;
