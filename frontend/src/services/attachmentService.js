import http from "../api/http";

/**
 * Carica un nuovo allegato per una nota.
 *
 * @param {number} noteId - ID della nota
 * @param {File} file - File da caricare
 */
export const uploadAttachment = async (noteId, file) => {
  const formData = new FormData();
  formData.append("file", file);

for (const [key, value] of formData.entries()) {
  console.log("FORMDATA:", key, value);
}

  const { data } = await http.post(
    `/notes/${noteId}/attachments`,
    formData
  );

  return data;
};

/**
 * Recupera gli allegati associati a una nota.
 *
 * @param {number} noteId - ID della nota
 */
export const getAttachments = async (noteId) => {
  const { data } = await http.get(
    `/notes/${noteId}/attachments`
  );
  return data;
};

/**
 * Elimina un allegato.
 *
 * @param {number} attachmentId - ID dell'allegato
 */
export const deleteAttachment = async (attachmentId) => {
  const { data } = await http.delete(
    `/attachments/${attachmentId}`
  );
  return data;
};

/**
 * Ottiene l'URL di download (SAS) per un allegato.
 *
 * @param {number} attachmentId - ID dell'allegato
 * @returns {Promise<{url: string}>} URL SAS firmato
 */
export const getAttachmentDownloadUrl = async (attachmentId) => {
  const { data } = await http.get(
    `/attachments/${attachmentId}/url`
  );
  return data;
};
