/**
 * Service di business per la generazione del Daily Brief AI.
 *
 * Responsabilità:
 * - raccogliere note e task rilevanti per la giornata corrente
 * - costruire il prompt per Azure OpenAI
 * - gestire cache, rigenerazioni e limiti giornalieri
 * - persistere il risultato nel database
 */

const Note = require("../models/Note");
const Task = require("../models/Task");
const DailyBrief = require("../models/DailyBrief");
const { generateSummary } = require("./azureOpenaiClient");

// Numero massimo di rigenerazioni forzate consentite al giorno
const MAX_REGENERATIONS = 5;

/**
 * Ritorna la data corrente in formato YYYY-MM-DD (UTC).
 * Usata come chiave logica per il Daily Brief giornaliero.
 */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Verifica se una data cade nel giorno corrente.
 * Usata per filtrare note e task "rilevanti oggi".
 */
function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Genera o recupera il Daily Brief per un utente.
 *
 * Comportamento:
 * - se esiste già un brief per oggi e force = false, ritorna cache
 * - se force = true, rigenera fino a MAX_REGENERATIONS
 * - se non ci sono attività, ritorna messaggio di fallback
 *
 * @param {number} userId - ID utente nel database
 * @param {Object} options
 * @param {boolean} options.force - forza la rigenerazione
 */
async function getDailyBrief(userId, { force = false } = {}) {
  const today = todayISO();

  // Recupera eventuale brief già generato oggi
  const existing = await DailyBrief.findByUserAndDate(userId, today);

  /**
   * Caso 1: rigenerazione forzata ma limite raggiunto
   * → ritorniamo il contenuto esistente
   */
  if (existing && force && existing.regenerated_count >= MAX_REGENERATIONS) {
    return {
      summary: existing.content,
      cached: true,
      limitReached: true,
    };
  }

  /**
   * Caso 2: brief già presente e nessuna rigenerazione richiesta
   */
  if (existing && !force) {
    return {
      summary: existing.content,
      cached: true,
    };
  }

  // Recupera tutte le note e i task dell'utente
  const notes = await Note.findAllByUser(userId);
  const tasks = await Task.findAllByUser(userId);

  // Filtra solo note create o modificate oggi
  const todayNotes = notes.filter(
    n => isToday(n.created_at) || isToday(n.updated_at)
  );

  // Filtra solo task con scadenza oggi
  const todayTasks = tasks.filter(
    t => t.due_date && isToday(t.due_date)
  );

  /**
   * Caso 3: nessuna attività rilevante per oggi
   * → evitiamo chiamata OpenAI
   */
  if (!todayNotes.length && !todayTasks.length) {
    return {
      summary: "Nessuna attività rilevante per oggi.",
      cached: false,
    };
  }

  /**
   * Costruzione del prompt per il modello AI.
   * Il prompt è intenzionalmente narrativo e contestuale,
   * non strutturato come lista.
   */
  const prompt = `
Agisci come un assistente di produttività personale simpatico riferendoti all'utente con il tu e non in terza persona.

CONTESTO:
Stai analizzando le attività svolte da un utente durante la giornata odierna.

NOTE CREATE O MODIFICATE OGGI:
${todayNotes.map(n =>
  `- Titolo: ${n.title}\n  Contenuto: ${n.content || "Nessun contenuto"}`
).join("\n")}

TASK CON SCADENZA O ATTIVE OGGI:
${todayTasks.map(t =>
  `- ${t.title} | Stato: ${t.status} | Priorità: ${t.priority || "non specificata"}`
).join("\n")}

ISTRUZIONI:
- Scrivi un **riassunto narrativo**, NON una lista
- Evidenzia i **progressi principali**
- Segnala eventuali **task critici, incompleti o rilevanti**
- Ignora contenuti ripetitivi o poco significativi
- Usa un tono **professionale, chiaro e orientato all’azione**
- Lunghezza massima: **6 frasi**
- Lingua: **italiano**

OUTPUT:
Riassunto giornaliero:
`;

  // Invio del prompt ad Azure OpenAI
  const summary = await generateSummary(prompt);

  /**
   * Persistenza:
   * - se esiste già, update
   * - se nuovo → insert
   */
  if (existing) {
    await DailyBrief.updateContent(existing.id, summary);

    if (force) {
      await DailyBrief.incrementRegeneration(userId, today);
    }
  } else {
    await DailyBrief.create({
      user_id: userId,
      brief_date: today,
      content: summary,
      model: "gpt-4o-mini",
      deployment: "nimbus-summarize",
    });
  }

  return {
    summary,
    cached: false,
    limitReached: false,
  };
}

module.exports = { getDailyBrief };
