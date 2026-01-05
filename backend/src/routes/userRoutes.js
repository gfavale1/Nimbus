const router = require("express").Router();
const ctrl = require("../controllers/userController");
const requireUser = require("../middleware/requireUser");

// Lista utenti
router.get("/", requireUser, ctrl.list);

router.get("/me", requireUser, ctrl.me);

// Ricerca utente per email
router.get("/by-email/:email", requireUser, ctrl.getByEmail);

// Dettaglio utente
router.get("/:id", requireUser, ctrl.get);

// Creazione utente
router.post("/", requireUser, ctrl.create);

// Aggiornamento utente
router.put("/:id", requireUser, ctrl.update);

// Eliminazione utente
router.delete("/:id", requireUser, ctrl.remove);

module.exports = router;
