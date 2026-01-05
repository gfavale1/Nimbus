import http from "../api/http";

/**
 * Recupera tutte le task dell'utente corrente.
 *
 * @returns {Promise<Array>} Lista delle task
 */
export const getAllTasks = async () => {
  const { data } = await http.get("/tasks");
  return data;
};

/**
 * Crea una nuova task.
 *
 * @param {Object} payload - Dati della task (title, description, due_date, status, ecc.)
 * @returns {Promise<Object>} Task creata
 */
export const createTask = async (payload) => {
  const { data } = await http.post("/tasks", payload);
  return data;
};

/**
 * Aggiorna una task esistente.
 *
 * @param {number} id - ID della task
 * @param {Object} payload - Campi da aggiornare
 * @returns {Promise<Object>} Task aggiornata
 */
export const updateTask = async (id, payload) => {
  const { data } = await http.put(`/tasks/${id}`, payload);
  return data;
};

/**
 * Elimina una task.
 *
 * @param {number} id - ID della task
 */
export const deleteTask = async (id) => {
  await http.delete(`/tasks/${id}`);
};
