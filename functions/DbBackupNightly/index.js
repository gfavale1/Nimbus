const { runBackup } = require("../lib/backup");

/**
 * Azure Function Timer Trigger per il backup periodico del database.
 *
 * La funzione viene eseguita a intervalli schedulati (tipicamente notturni) e:
 * - verifica la presenza delle variabili d'ambiente necessarie
 * - avvia il processo di backup del database
 * - salva il file di backup su Azure Blob Storage
 * - registra nei log l'esito dell'operazione
 *
 * @async
 * @function DbBackupNightly
 *
 * @param {Object} context - Contesto di esecuzione Azure Function
 * @param {Object} context.log - Logger fornito da Azure
 * @param {Object} myTimer - Oggetto Timer Trigger (non utilizzato direttamente)
 *
 * @returns {Promise<void>} Nessun valore di ritorno (Timer Trigger)
 */
module.exports = async function DbBackupNightly(context, myTimer) {
  const startedAt = new Date().toISOString();

  context.log("[DbBackupNightly] Avvio backup database", { startedAt });

  try {
    // Verifica delle variabili d'ambiente richieste
    const requiredEnv = [
      "DB_HOST",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "BLOB_CONN_STRING",
    ];

    const missingEnvVars = requiredEnv.filter(
      (key) => !process.env[key]
    );

    if (missingEnvVars.length > 0) {
      context.log.error(
        "[DbBackupNightly] Variabili d'ambiente mancanti",
        { missing: missingEnvVars }
      );
      return;
    }

    const result = await runBackup();

    context.log("[DbBackupNightly] Backup completato con successo", {
      fileName: result.fileName,
      url: result.url,
      bytes: result.bytes,
    });
  } catch (error) {
    context.log.error("[DbBackupNightly] Errore durante il backup", {
      message: error.message,
      stack: error.stack,
    });
  }
};
