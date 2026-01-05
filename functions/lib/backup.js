const { promises: fs } = require("fs");
const path = require("path");
const mysqldump = require("mysqldump");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

/**
 * Restituisce il valore della prima variabile d'ambiente definita
 * tra quelle fornite.
 *
 * @param {...string} names - Nomi delle variabili d'ambiente
 * @returns {string|undefined} Valore trovato o undefined
 */
function envOr(...names) {
  for (const name of names) {
    if (process.env[name] !== undefined) {
      return process.env[name];
    }
  }
  return undefined;
}

/**
 * Esegue il backup del database MySQL e lo carica su Azure Blob Storage.
 *
 * La funzione:
 * - recupera i parametri di connessione al database dalle variabili d'ambiente
 * - genera un dump SQL su file temporaneo
 * - carica il file su Azure Blob Storage
 * - rimuove il file temporaneo locale
 *
 * @async
 * @function runBackup
 *
 * @returns {Promise<{fileName: string, url: string, bytes: number}>}
 *          Informazioni sul file di backup generato.
 *
 * @throws {Error} Se mancano variabili d'ambiente o se il backup fallisce
 */
async function runBackup() {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `mysql-backup-${date}-${uuidv4().slice(0, 8)}.sql`;

  // In Azure Functions (Linux) la directory /tmp è scrivibile
  const tmpPath = path.join("/tmp", fileName);

  // Parametri di connessione al database 
  const host = envOr("DB_HOST", "MYSQL_HOST");
  const port = Number(envOr("DB_PORT", "MYSQL_PORT") || 3306);
  const user = envOr("DB_USER", "MYSQL_USER");
  const password = envOr("DB_PASSWORD", "MYSQL_PASSWORD");
  const database = envOr("DB_NAME", "MYSQL_DATABASE");

  if (!host || !user || !password || !database) {
    throw new Error("Missing DB connection env vars (DB_* or MYSQL_*)");
  }

  // Configurazione TLS per Azure Database for MySQL 
  const rejectUnauthorized =
    String(
      process.env.DB_SSL_REJECT_UNAUTHORIZED ?? "true"
    ).toLowerCase() === "true";

  const ssl = {
    minVersion: "TLSv1.2",
    rejectUnauthorized,
  };

  // Dump del database su file temporaneo 
  await mysqldump({
    connection: { host, port, user, password, database, ssl },
    dumpToFile: tmpPath,
    compressFile: false, // può essere abilitato per ottenere un file .gz
  });

  // Upload del file su Azure Blob Storage 
  const blobConnectionString = process.env.BLOB_CONN_STRING;
  const containerName =
    process.env.BLOB_BACKUP_CONTAINER || "db-backups";

  if (!blobConnectionString) {
    throw new Error("Missing BLOB_CONN_STRING");
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(
      blobConnectionString
    );

  const containerClient =
    blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists();

  const blockBlobClient =
    containerClient.getBlockBlobClient(fileName);

  const fileBuffer = await fs.readFile(tmpPath);

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: "application/sql",
    },
  });

  // Cleanup file temporaneo 
  try {
    await fs.unlink(tmpPath);
  } catch {
    // Ignora eventuali errori di cleanup
  }

  return {
    fileName,
    url: blockBlobClient.url,
    bytes: fileBuffer.length,
  };
}

module.exports = { runBackup };
