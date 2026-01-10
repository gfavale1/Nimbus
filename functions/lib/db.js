const mysql = require("mysql2/promise");

let pool;

/**
 * Restituisce il valore di una variabile d'ambiente oppure un fallback.
 *
 * @param {string} name - Nome della variabile d'ambiente
 * @param {*} fallback - Valore di fallback
 * @returns {*} Valore risolto
 */
function env(name, fallback) {
  return process.env[name] ?? fallback;
}

/**
 * Restituisce (o inizializza) il pool di connessioni MySQL.
 *
 * Il pool viene creato una sola volta (lazy initialization) e riutilizzato
 * per tutte le query successive.
 *
 * @function getPool
 * @returns {import("mysql2/promise").Pool} Pool di connessioni MySQL
 *
 * @throws {Error} Se mancano le variabili d'ambiente necessarie
 */
function getPool() {
  if (!pool) {
    const host = env("DB_HOST", process.env.DB_HOST);
    const port = Number(env("DB_PORT", process.env.DB_PORT) || 3306);
    const user = env("DB_USER", process.env.DB_USER);
    const password = env("DB_PASSWORD", process.env.DB_PASSWORD);
    const database = env("DB_NAME", process.env.DB_DATABASE);

    if (!host || !user || !password || !database) {
      throw new Error(
        "Missing DB env (DB_HOST/USER/PASSWORD/NAME or MYSQL_*)"
      );
    }

    const rejectUnauthorized =
      String(
        process.env.DB_SSL_REJECT_UNAUTHORIZED || "true"
      ).toLowerCase() === "true";

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized,
      },
    });
  }

  return pool;
}

/**
 * Esegue una query SQL utilizzando il pool di connessioni.
 *
 * @async
 * @function query
 *
 * @param {string} sql - Query SQL con placeholder
 * @param {Array<any>} [params] - Parametri della query
 *
 * @returns {Promise<Array<any>>} Risultato della query
 */
async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

module.exports = {
  getPool,
  query,
};
