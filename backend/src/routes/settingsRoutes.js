const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/settingsController");
const requireUser = require("../middleware/requireUser");

// Recupero preferenze utente autenticato
router.get("/me", requireUser, getSettings);

// Aggiornamento preferenze utente autenticato
router.put("/me", requireUser, updateSettings);

module.exports = router;
