import http from "../api/http";

/**
 * Recupera tutte le note dell'utente corrente.
 */
export const getAllNotes = async () => {
  const { data } = await http.get("/notes");
  return data;
};

/**
 * Recupera una singola nota per ID.
 *
 * @param {number} id - ID della nota
 */
export const getNoteById = async (id) => {
  const { data } = await http.get(`/notes/${id}`);
  return data;
};

/**
 * Crea una nuova nota.
 *
 * @param {Object} payload - { title, content }
 */
export const createNote = async (payload) => {
  const { data } = await http.post("/notes", payload);
  return data;
};

/**
 * Aggiorna una nota esistente.
 *
 * @param {number} id - ID della nota
 * @param {Object} payload - Campi da aggiornare
 */
export const updateNote = async (id, payload) => {
  const { data } = await http.put(`/notes/${id}`, payload);
  return data;
};

/**
 * Elimina una nota.
 *
 * @param {number} id - ID della nota
 */
export const deleteNote = async (id) => {
  await http.delete(`/notes/${id}`);
};

/**
 * Recupera le note condivise con l'utente corrente.
 */
export const getSharedNotes = async () => {
  const { data } = await http.get("/notes/shared/me");
  return data;
};

/**
 * Condivide una nota con un altro utente.
 *
 * @param {number} noteId - ID della nota
 * @param {string} email - Email dell'utente destinatario
 * @param {string} role - viewer | editor
 */
export const shareNote = async (noteId, email, role = "viewer") => {
  const { data } = await http.post(`/notes/${noteId}/shared`, { email, role });
  return data;
};

/**
 * Rimuove la condivisione di una nota.
 *
 * @param {number} noteId - ID della nota
 * @param {number} userId - ID dell'utente da rimuovere
 */
export const removeShare = async (noteId, userId) => {
  const { data } = await http.delete(`/notes/${noteId}/shares/${userId}`);
  return data;
};

/**
 * Recupera la lista degli utenti con cui una nota è condivisa.
 *
 * @param {number} noteId - ID della nota
 */
export const getNoteShares = async (noteId) => {
  const { data } = await http.get(`/notes/${noteId}/shares`);
  return data;
};

/**
 * Recupera gli allegati associati a una nota.
 *
 * @param {number} noteId - ID della nota
 */
export const getNoteAttachments = async (noteId) => {
  const { data } = await http.get(`/notes/${noteId}/attachments`);
  return data;
};

/**
 * Recupera lo storico delle versioni di una nota.
 *
 * @param {number} id - ID della nota
 */
export const getNoteHistory = async (id) => {
  const { data } = await http.get(`/notes/${id}/history`);
  return data;
};

/**
 * Ripristina una versione precedente di una nota.
 *
 * @param {number} noteId - ID della nota
 * @param {number} historyId - ID della versione storica
 */
export const restoreNoteVersion = async (noteId, historyId) => {
  const { data } = await http.post(
    `/notes/${noteId}/restore/${historyId}`
  );
  return data;
};

/**
 * Aggiorna i tag associati a una nota.
 *
 * @param {number} noteId - ID della nota
 * @param {string} tagsString - Stringa CSV (es. "studio, cloud, esame")
 */
export const updateNoteTags = async (noteId, tagsString) => {
  const tagNames = tagsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== "");

  const { data } = await http.put(`/notes/${noteId}/tags`, {
    names: tagNames,
  });

  return data;
};
