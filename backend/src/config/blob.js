/**
 * Configurazione Azure Blob Storage.
 * Utilizzato dai services per la gestione degli allegati.
 * Le variabili d'ambiente le carico nel bootstrap (server.js).
 */

const fs = require("fs");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

const {
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_STORAGE_ACCOUNT,
  AZURE_STORAGE_KEY,
  AZURE_STORAGE_CONTAINER,
  AZURE_BLOB_CONTAINER,
} = process.env;

const containerName =
  AZURE_STORAGE_CONTAINER ||
  AZURE_BLOB_CONTAINER ||
  "nimbus-attachments";

let blobServiceClient;
let credential;
let accountName = AZURE_STORAGE_ACCOUNT;

/**
 * Inizializzazione client Blob Storage.
 * Funziona sia con connection string che co account/key.
 */
if (AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient =
    BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

  try {
    const parts = Object.fromEntries(
      AZURE_STORAGE_CONNECTION_STRING.split(";")
        .filter(Boolean)
        .map(kv => kv.split("="))
    );

    accountName = accountName || parts.AccountName;
    if (parts.AccountName && parts.AccountKey) {
      credential = new StorageSharedKeyCredential(
        parts.AccountName,
        parts.AccountKey
      );
    }
  } catch {
    // Parsing non critico: client già inizializzato
  }
} else if (AZURE_STORAGE_ACCOUNT && AZURE_STORAGE_KEY) {
  credential = new StorageSharedKeyCredential(
    AZURE_STORAGE_ACCOUNT,
    AZURE_STORAGE_KEY
  );

  blobServiceClient = new BlobServiceClient(
    `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
    credential
  );
} else {
  throw new Error(
    "Azure Blob Storage non configurato. Impostare AZURE_STORAGE_CONNECTION_STRING oppure AZURE_STORAGE_ACCOUNT e AZURE_STORAGE_KEY."
  );
}

function getContainerClient() {
  return blobServiceClient.getContainerClient(containerName);
}

module.exports = {
  getContainerClient,
  containerName,
  accountName,
  credential, // opzionale, esposta solo se disponibile
};
