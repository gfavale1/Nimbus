/**
 * Dashboard Controller
 * Espone i dati riepilogativi dell’utente autenticato per la dashboard principale.
 * La logica di aggregazione è delegata al dashboardService.
 */

const { getDashboardOverview } = require("../services/dashboardService");

/**
 * GET /api/dashboard
 */
async function getOverview(req, res, next) {
  try {
    const userId = req.user.dbId;

    const overview = await getDashboardOverview(userId);

    res.json(overview);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview
};
