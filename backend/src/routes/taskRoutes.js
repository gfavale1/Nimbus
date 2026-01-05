const router = require("express").Router();
const taskCtrl = require("../controllers/taskController");
const requireUser = require("../middleware/requireUser");

// Lista task dell'utente
router.get("/", requireUser, taskCtrl.listTasks);

// Creazione nuovo task
router.post("/", requireUser, taskCtrl.create);

// Dettaglio task
router.get("/:id", requireUser, taskCtrl.getTask);

// Aggiornamento task
router.put("/:id", requireUser, taskCtrl.update);

// Eliminazione task
router.delete("/:id", requireUser, taskCtrl.remove);

module.exports = router;
