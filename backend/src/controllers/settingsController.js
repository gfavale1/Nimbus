/**
 * Settings Controller
 * Gestisce le preferenze dell’utente autenticato (notifiche e promemoria).
 * La logica di persistenza è delegata al settingsService.
 */

const {
  getUserSettings,
  updateUserSettings
} = require("../services/settingsService");

/**
 * GET /api/settings
 */
async function getSettings(req, res, next) {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ error: "Utente non autenticato" });
    }

    const settings = await getUserSettings(userId);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/settings
 */
async function updateSettings(req, res, next) {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ error: "Utente non autenticato" });
    }

    await updateUserSettings(userId, req.body);

    res.json({
      success: true,
      message: "Preferenze aggiornate"
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSettings
};
