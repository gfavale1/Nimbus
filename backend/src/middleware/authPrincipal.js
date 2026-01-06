const isDevBypass = process.env.EASYAUTH_BYPASS_DEV === '1';

/**
 * Estrae e decodifica l'header X-MS-CLIENT-PRINCIPAL di EasyAuth
 */
function parseEasyAuthPrincipal(req) {
  const b64 = req.headers['x-ms-client-principal'];
  if (!b64) return null;
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    const claims = Object.fromEntries(obj?.claims?.map(c => [c.typ, c.val]) || []);
    return {
      external_id: claims.oid || claims.sub || claims.nameid,
      email: claims.preferred_username || claims.upn || claims.emails,
      name: claims.name || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
    };
  } catch (err) {
    console.error("[authPrincipal] parse error:", err);
    return null;
  }
}

/**
 * Middleware principale: setta req.principal se autenticato.
 * In dev può usare un header x-dev-user passato dal frontend.
 */
function authPrincipal(req, res, next) {
  console.log("[authPrincipal] headers x-ms-client-principal:", req.headers["x-ms-client-principal"]);

  const principal = parseEasyAuthPrincipal(req);

  console.log("[authPrincipal] parsed principal:", principal);

  if (principal?.external_id) {
    req.principal = principal;
    return next();
  }

  return res.status(401).json({ error: "Unauthorized (authPrincipal)" });
}

module.exports = { authPrincipal };

