const axios = require("axios");

/**
 * Client minimale per l'interazione con Azure OpenAI.
 *
 * Questo modulo è pensato per l'uso all'interno delle Azure Functions
 * e fornisce una semplice astrazione per l'invio di prompt testuali
 * e la ricezione di risposte generate dal modello.
 */

// Variabili d'ambiente di configurazione
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const apiVersion = "2024-02-15-preview";

if (!endpoint || !deployment || !apiKey) {
  console.warn("[AzureOpenAI] Variabili d'ambiente non configurate correttamente");
}

/**
 * Invia un prompt testuale ad Azure OpenAI e restituisce il testo generato.
 *
 * La funzione utilizza l'endpoint Chat Completions di Azure OpenAI
 * con un prompt di sistema predefinito orientato alla produttività.
 *
 * @async
 * @function generateSummary
 *
 * @param {string} prompt - Prompt testuale da fornire al modello
 *
 * @returns {Promise<string|null>}
 *          Testo generato dal modello oppure `null` se non disponibile.
 */
async function generateSummary(prompt) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await axios.post(
    url,
    {
      messages: [
        {
          role: "system",
          content: "Sei un assistente di produttività personale.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 350,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    }
  );

  return response.data?.choices?.[0]?.message?.content || null;
}

module.exports = {
  generateSummary,
};
