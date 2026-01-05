/**
 * Template email per il Daily Brief generato dall'AI.
 *
 * @param {string} summary - Testo del riepilogo giornaliero
 * @returns {string} HTML dell'email
 */

const { baseTemplate } = require("./baseTemplate");

function dailyBriefTemplate(summary) {
  return baseTemplate({
    title: "Il tuo Daily Brief AI",
    content: `
      <p>Buongiorno,</p>
      <p>L'intelligenza artificiale di Nimbus ha analizzato le tue attività. Ecco il tuo piano d'azione:</p>

      <div style="
        background: #ffffff;
        border: 1px solid #e0e7ff;
        border-top: 4px solid #4f46e5;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        font-style: italic;
        line-height: 1.8;
        color: #374151;
        white-space: pre-line;
      ">
        ${summary}
      </div>

      <p style="margin-top: 25px; font-size: 14px; color: #6b7280; text-align: center;">
        Generato automaticamente per aiutarti a focalizzarti su ciò che conta.
      </p>
    `,
  });
}

module.exports = { dailyBriefTemplate };