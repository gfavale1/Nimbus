const axios = require("axios");

/**
 * Client di integrazione con Azure OpenAI.
 *
 * Responsabilità:
 * - inviare prompt testuali al deployment Azure OpenAI
 * - restituire esclusivamente il contenuto testuale generato
 *
 * NB =
 * - non contiene logica di business
 * - non conosce utenti, note o task
 * - è utilizzato da dailyBriefService
 */
async function generateSummary(prompt) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiKey = process.env.AZURE_OPENAI_KEY;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

  const res = await axios.post(
    url,
    {
      messages: [
        {
          role: "system",
          content: "Sei un assistente che riassume attività personali in modo chiaro e conciso."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 500
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      }
    }
  );

  const content = res.data?.choices?.[0]?.message?.content;

  if (!content || !content.trim()) {
    console.warn("[AzureOpenAI] Risposta vuota:", res.data);
    return null;
  }

  return content.trim();
}

module.exports = { generateSummary };
