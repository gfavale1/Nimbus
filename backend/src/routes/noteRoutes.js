const express = require("express");
const router = express.Router();

const noteController = require("../controllers/noteController");
const requireUser = require("../middleware/requireUser");

// Note condivise con l'utente autenticato
// GET /api/notes/shared/me
router.get("/shared/me", requireUser, noteController.listSharedWithMe);

// Lista note personali
// GET /api/notes
router.get("/", requireUser, noteController.listNotes);

// Dettaglio singola nota (owner / viewer)
router.get("/:id", requireUser, noteController.getNote);

// Creazione nota
router.post("/", requireUser, noteController.create);

// Aggiornamento nota (owner / editor)
router.put("/:id", requireUser, noteController.update);

// Eliminazione nota (solo owner)
router.delete("/:id", requireUser, noteController.remove);

module.exports = router;
