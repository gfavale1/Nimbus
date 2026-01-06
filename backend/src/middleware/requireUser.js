const db = require("../config/db");

/**
 * Crea o aggiorna un utente locale a partire dall'external_id
 * (proveniente da Azure Entra ID / token MSAL).
 *
 * Strategia:
 * - external_id è la chiave logica stabile
 * - se l’utente esiste → aggiorna email e display_name
 * - se non esiste → crea nuova riga
 *
 * Ritorna sempre l'id interno del database (dbId).
 */
async function upsertUserByExternalId({ external_id, email, name }) {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE external_id = ? LIMIT 1",
    [external_id]
  );

  if (rows.length) {
    const userId = rows[0].id;

    // Aggiorniamo sempre email e display_name (se fornito)
    await db.query(
      "UPDATE users SET email = ?, display_name = COALESCE(?, display_name) WHERE id = ?",
      [email, name || null, userId]
    );

    return userId;
  }

  // Nuovo utente
  const [res] = await db.query(
    "INSERT INTO users (external_id, email, display_name) VALUES (?, ?, ?)",
    [external_id, email, name || null]
  );

  return res.insertId;
}

/**
 * Middleware di autenticazione principale.
 *
 * Responsabilità:
 * - Identifica l’utente (EasyAuth, token MSAL o fallback locale)
 * - Sincronizza l’utente con il database
 * - Espone SEMPRE req.user = { dbId, externalId, email, name }
 *
 * Modalità che mi sono deciso:
 * 1) Azure EasyAuth (produzione)
 * 2) Token MSAL Bearer (sviluppo locale)
 * 3) Fallback mock (solo non-production)
 */
async function requireUser(req, res, next) {
  try {
    if (!req.principal) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { external_id, email, name } = req.principal;

      const dbId = await upsertUserByExternalId({
        external_id: externalId,
        email,
        name
      });
  
      req.user = {
        id: dbId,        
        dbId,
        externalId,
        email,
        name
      };
      return next();
    }

    /* -------------------------------------------------------
     * TOKEN BEARER (SVILUPPO LOCALE)
     * ----------------------------------------------------- */
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token && token.includes(".")) {
        let decoded = {};
        try {
          const payload = Buffer.from(token.split(".")[1], "base64").toString("utf8");
          decoded = JSON.parse(payload);
        } catch (_) {}

        const externalId = decoded.oid || decoded.sub || "unknown";
        const email =
          decoded.preferred_username ||
          decoded.upn ||
          decoded.email ||
          "unknown@example.com";
        const name = decoded.name || email.split("@")[0] || "User";

        const dbId = await upsertUserByExternalId({
          external_id: externalId,
          email,
          name
        });

        req.user = {
          id: dbId,      
          dbId,
          externalId,
          email,
          name
        };
        return next();
      }
    }

    /* -------------------------------------------------------
     * FALLBACK LOCALE
     * ----------------------------------------------------- */
    if (process.env.NODE_ENV !== "production") {
      req.user = {
        id: 1,          
        dbId: 1,
        externalId: "local-dev",
        email: "local@dev",
        name: "Local Dev User"
      };
      return next();
    }

    return res.status(401).json({
      message: "Unauthorized: missing or invalid authentication"
    });

  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      req.user = {
        id: 1,           
        dbId: 1,
        externalId: "local-bypass",
        email: "bypass@dev",
        name: "Bypass User"
      };
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = requireUser;
