/**
 * Service di integrazione con Azure Blob Storage.
 *
 * Responsabilità:
 * - Upload di allegati (note / task) su Blob Storage
 * - Cancellazione dei blob associati
 * - Generazione di SAS URL temporanee (read-only)
 *
 * NB = Ho fatto che i controlli di accesso avvengono nei controller e nei permissionService.
 * NBB = con lazy intendo che gli oggetti mi vengono creati solo quando servono veramente, e poi riusati per tutte le richieste
 * Quindi vengono creati solo alla prima chiamata, rimangono poi in cache!! -- (Su Stackoverflow dicono sia costoso da creare il blob client)
 */

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters
} = require("@azure/storage-blob");

const { v4: uuidv4 } = require("uuid");

/**
 * Cache lazy del container client:
 * evita di ricrearlo a ogni richiesta.
 */
let _containerClient = null;

/**
 * Cache della configurazione SAS:
 * contiene credential e endpoint blob.
 */
let _sasConfig = null;

/**
 * Recupera la connection string di Azure Blob Storage
 * supportando più nomi di variabili ambiente.
 *
 * @throws Error se nessuna variabile è configurata
 */
function getConnectionString() {
  const cs =
    process.env.BLOB_CONN_STRING ||
    process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!cs) {
    throw new Error(
      "Blob storage connection string mancante (BLOB_CONN_STRING o AZURE_STORAGE_CONNECTION_STRING)"
    );
  }
  return cs;
}

/**
 * Recupera il nome del container Blob.
 * Il container è considerato PRIVATO.
 */
function getContainerName() {
  return process.env.AZURE_STORAGE_CONTAINER;
}

/**
 * Analizza una connection string Azure Blob
 * per estrarre AccountName e AccountKey.
 *
 * Serve esclusivamente per generare SAS URL.
 */
function parseConnectionString(cs) {
  const parts = cs.split(";");
  const map = {};

  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k && v) {
      map[k.toLowerCase()] = v;
    }
  }

  return {
    accountName: map["accountname"],
    accountKey: map["accountkey"],
    endpointSuffix: map["endpointsuffix"] || "core.windows.net",
    defaultEndpointsProtocol: map["defaultendpointsprotocol"] || "https"
  };
}

/**
 * Inizializza (lazy) e restituisce il ContainerClient.
 * Il container viene creato se non esiste.
 */
async function getContainerClient() {
  if (_containerClient) return _containerClient;

  const connStr = getConnectionString();
  const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  const containerName = getContainerName();

  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Crea il container se non esiste (privato di default)
  await containerClient.createIfNotExists();

  _containerClient = containerClient;
  return _containerClient;
}

/**
 * Inizializza (lazy) la configurazione per la generazione delle SAS URL.
 *
 * @throws Error se AccountName o AccountKey non sono disponibili
 */
function getSasConfig() {
  if (_sasConfig) return _sasConfig;

  const cs = getConnectionString();
  const parsed = parseConnectionString(cs);

  if (!parsed.accountName || !parsed.accountKey) {
    throw new Error(
      "Impossibile generare SAS: AccountName/AccountKey mancanti"
    );
  }

  const credential = new StorageSharedKeyCredential(
    parsed.accountName,
    parsed.accountKey
  );

  const blobEndpoint = `${parsed.defaultEndpointsProtocol}://${parsed.accountName}.blob.${parsed.endpointSuffix}`;

  _sasConfig = {
    accountName: parsed.accountName,
    credential,
    blobEndpoint
  };

  return _sasConfig;
}

/**
 * Sanifica il nome del file per renderlo compatibile con Azure Blob.
 */
function sanitizeFilename(name) {
  return String(name)
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "-");
}

/**
 * Upload di un allegato associato a una nota.
 *
 * @param {Buffer} buffer - contenuto binario del file
 * @param {string} contentType - MIME type
 * @param {string} originalName - nome originale del file
 * @param {number} noteId - ID della nota
 * @param {number} userId - ID dell'utente uploader
 *
 * @returns {Object} metadati da salvare nel DB
 */
async function uploadAttachment({
  buffer,
  contentType,
  originalName,
  noteId,
  userId
}) {
  const containerClient = await getContainerClient();

  const safeName = sanitizeFilename(originalName || "file");
  const blobName = `notes/${noteId}/${uuidv4()}-${safeName}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const uploadResult = await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType || "application/octet-stream"
    }
  });

  return {
    blobName,
    fileName: originalName,
    contentType: contentType || "application/octet-stream",
    size: buffer.length,
    etag: uploadResult.etag || null
  };
}

/**
 * Cancella un blob dal container.
 * Usato quando un allegato viene eliminato.
 */
async function deleteAttachmentBlob(blobName) {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

/**
 * Genera una SAS URL temporanea in sola lettura.
 *
 * @param {string} blobName - nome del blob
 * @param {number} expiresInMinutes - durata della validità
 *
 * @returns {string} URL firmata per il download
 */
async function generateReadSasUrl(blobName, expiresInMinutes = 15) {
  const { credential, blobEndpoint } = getSasConfig();
  const containerName = getContainerName();

  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const sasParams = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn
    },
    credential
  );

  const encodedBlobName = encodeURIComponent(blobName);
  return `${blobEndpoint}/${containerName}/${encodedBlobName}?${sasParams.toString()}`;
}

module.exports = {
  uploadAttachment,
  deleteAttachmentBlob,
  generateReadSasUrl
};
