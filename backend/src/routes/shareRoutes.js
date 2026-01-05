const router = require("express").Router();
const ctrl = require("../controllers/shareController");
const requireUser = require("../middleware/requireUser");

// Note condivise con l'utente autenticato
router.get("/notes/shares/me", requireUser, ctrl.listSharedWithMe);

// Elenco condivisioni di una nota (viewer / owner)
router.get("/notes/:noteId/shares", requireUser, ctrl.listForNote);

// Aggiunta condivisione (solo owner)
router.post("/notes/:noteId/shares", requireUser, ctrl.add);

// Aggiornamento ruolo condiviso (solo owner)
router.put("/notes/:noteId/shares/:userId", requireUser, ctrl.update);

// Rimozione condivisione (solo owner)
router.delete("/notes/:noteId/shares/:userId", requireUser, ctrl.remove);

module.exports = router;
