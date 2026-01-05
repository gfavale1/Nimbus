const db = require("./db");
const { generateSummary } = require("./azureOpenaiClient.js");

/**
 * Restituisce la data odierna in formato ISO (YYYY-MM-DD, UTC).
 *
 * @returns {string} Data corrente in formato ISO
 */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Genera (o rigenera) il Daily Brief per un utente specifico.
 *
 * La funzione:
 * - recupera le note create o modificate nella giornata corrente
 * - recupera i task con scadenza nella giornata corrente
 * - costruisce un prompt strutturato per il modello AI
 * - genera un riepilogo testuale tramite Azure OpenAI
 *
 *
 * @async
 * @function generateDailyBriefForUser
 *
 * @param {number} userId - Identificativo dell'utente
 *
 * @returns {Promise<string|null>}
 *          Ritorna il testo del Daily Brief se sono presenti dati,
 *          oppure `null` se non ci sono note o task rilevanti.
 */
async function generateDailyBriefForUser(userId) {
  const today = todayISO();

  // Recupera le note create o modificate oggi
  const notes = await db.query(
    `
    SELECT title, content
    FROM notes
    WHERE user_id = ?
      AND DATE(updated_at) = ?
    `,
    [userId, today]
  );

  // Recupera i task con scadenza odierna
  const tasks = await db.query(
    `
    SELECT title, status, priority
    FROM tasks
    WHERE user_id = ?
      AND due_date IS NOT NULL
      AND DATE(due_date) = ?
    `,
    [userId, today]
  );

  // Se non ci sono dati rilevanti, non genera il Daily Brief
  if (!notes?.length && !tasks?.length) {
    return null;
  }

  // Costruzione del prompt per il modello AI
  const prompt = `
Agisci come un assistente di produttività personale.

DATI DELLA GIORNATA:

NOTE CREATE O MODIFICATE OGGI:
${notes
  .map(
    (note) =>
      `- ${note.title}: ${note.content || "Nessun contenuto"}`
  )
  .join("\n")}

TASK CON SCADENZA OGGI:
${tasks
  .map(
    (task) =>
      `- ${task.title} (${task.status}, priorità ${task.priority})`
  )
  .join("\n")}

ISTRUZIONI:
- Fornisci un riassunto in italiano
- Massimo 6–8 frasi
- Evidenzia task importanti o urgenti
- Tono chiaro, professionale e orientato all’azione
`;

  const summary = await generateSummary(prompt);

  return summary?.trim() || null;
}

module.exports = {
  generateDailyBriefForUser,
};
