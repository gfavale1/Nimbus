const router = require("express").Router();
const ctrl = require("../controllers/noteTagController");
const requireUser = require("../middleware/requireUser");

// Lista tag associati a una nota
router.get("/:noteId/tags", requireUser, ctrl.getTagsForNote);

// Aggiunta tag a una nota (owner / editor)
router.post("/:noteId/tags", requireUser, ctrl.addTags);

// Sostituzione completa dei tag della nota (owner / editor)
router.put("/:noteId/tags", requireUser, ctrl.replaceTags);

// Rimozione singolo tag dalla nota (owner / editor)
router.delete("/:noteId/tags/:tagId", requireUser, ctrl.removeTag);

module.exports = router;
