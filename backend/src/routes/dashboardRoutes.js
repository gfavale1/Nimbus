const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');

// Overview dashboard utente (note, task, allegati, scadenze)
router.get('/', ctrl.getOverview);

module.exports = router;
