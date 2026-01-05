const router = require("express").Router();
const ctrl = require("../controllers/tagController");
const requireUser = require("../middleware/requireUser");

// Lista tag (con ricerca/paginazione)
router.get("/", requireUser, ctrl.list);

// Dettaglio singolo tag
router.get("/:id", requireUser, ctrl.get);

// Creazione nuovo tag
router.post("/", requireUser, ctrl.create);

// Aggiornamento tag
router.put("/:id", requireUser, ctrl.update);

// Eliminazione tag
router.delete("/:id", requireUser, ctrl.remove);

module.exports = router;
