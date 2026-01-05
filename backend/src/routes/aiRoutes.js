const express = require("express");
const requireUser = require("../middleware/requireUser");
const { getDailyBrief } = require("../services/dailyBriefService");

const router = express.Router();

/**
 * GET /api/ai/daily-brief
 * Genera il riassunto AI delle note e task dell’utente autenticato.
 * Non invia email. Uso esclusivo frontend.
 */
router.get("/daily-brief", requireUser, async (req, res, next) => {
  try {
    const force = req.query.force === "1";
    const brief = await getDailyBrief(req.user.dbId, { force });
    res.json(brief);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
