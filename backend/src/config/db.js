/**
 * Configurazione pool MySQL.
 * Utilizzato da models e services.
 * Le variabili d'ambiente sono caricate nel bootstrap (server.js).
 */

const fs = require("fs");
const mysql = require("mysql2/promise");

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT = 3306,
  DB_SSL_REJECT_UNAUTHORIZED = "true",
  DB_SSL_CA_PATH,
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error("Variabili DB non si trovano (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)");
}

// Configurazione SSL (Azure MySQL / produzione)
const ssl = {
  minVersion: "TLSv1.2",
  rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED !== "false",
};

// Caricamento CA se fornita
if (DB_SSL_CA_PATH && fs.existsSync(DB_SSL_CA_PATH)) {
  ssl.ca = fs.readFileSync(DB_SSL_CA_PATH, "utf8");
}

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT),
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
