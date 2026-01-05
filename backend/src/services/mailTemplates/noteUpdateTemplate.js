/**
 * Template base HTML per tutte le email Nimbus.
 *
 * @param {Object} params
 * @param {string} params.noteTitle - Nome della nota
 * @param {string} params.content - Contenuto HTML principale
 * @returns {string} HTML email completo
 */

const { baseTemplate } = require("./baseTemplate");

function noteUpdateTemplate({ noteTitle, action }) { 
  const actionColors = {
    creata: "#10b981",
    modificata: "#3b82f6",
    eliminata: "#ef4444"
  };
  const color = actionColors[action] || "#6b7280";

  return baseTemplate({
    title: "Aggiornamento Nota",
    content: `
      <p>Ti informiamo che una nota è stata <strong>${action}</strong>:</p>

      <div style="padding: 16px; border-left: 4px solid ${color}; background: #f9fafb; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px; font-weight: 600;">${noteTitle}</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: ${color}; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
          Stato: ${action}
        </p>
      </div>
    `,
  });
}

module.exports = { noteUpdateTemplate };