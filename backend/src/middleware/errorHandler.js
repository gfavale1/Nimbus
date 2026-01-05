/**
 * Middleware globale di gestione errori.
 * Deve essere registrato come ultimo middleware dell'app Express.
 *
 * - Usa err.status se presente
 * - Fallback a 500
 * - Ritorna sempre JSON
 */
function errorHandler(err, _req, res, _next) {
  console.error(err);

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
}

module.exports = errorHandler;
