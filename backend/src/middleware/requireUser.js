const db = require("../config/db");

/**
 * Crea o aggiorna un utente locale a partire dall'external_id
 * (proveniente da Azure Entra ID / Easy Auth).
 */
async function upsertUserByExternalId({ external_id, email, name }) {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE external_id = ? LIMIT 1",
    [external_id]
  );

  if (rows.length) {
    const userId = rows[0].id;
    await db.query(
      "UPDATE users SET email = ?, display_name = COALESCE(?, display_name) WHERE id = ?",
      [email, name || null, userId]
    );
    return userId;
  }

  const [res] = await db.query(
    "INSERT INTO users (external_id, email, display_name) VALUES (?, ?, ?)",
    [external_id, email, name || null]
  );
  return res.insertId;
}

/**
 * Middleware di autenticazione principale.
 * Usa ESCLUSIVAMENTE req.principal (settato da authPrincipal).
 * Niente più locale mi dava problemi con app service (crashava)
 */
async function requireUser(req, res, next) {
  try {
    if (!req.principal && req.headers['x-nimbus-userid']) {
      req.principal = {
        external_id: req.headers['x-nimbus-userid'],
        email: req.headers['x-nimbus-email'] || 'unknown@unisa.it',
        name: req.headers['x-nimbus-username'] || 'User'
      };
    }

    if (!req.principal) {
      return res.status(401).json({ message: "Unauthorized (authPrincipal)" });
    }

    const { external_id, email, name } = req.principal;

    const dbId = await upsertUserByExternalId({
      external_id,
      email,
      name,
    });

    req.user = {
      id: dbId,
      dbId,
      externalId: external_id,
      email,
      name,
    };

    return next();
  } catch (err) {
    console.error("[requireUser] error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = requireUser;
