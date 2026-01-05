/**
 * Template email generico per promemoria task.
 *
 * Usato per creazione, aggiornamento e cancellazione task.
 *
 * @param {Object} params
 * @param {string} params.taskTitle - Titolo del task
 * @param {string|null} params.dueDate - Data di scadenza
 * @returns {string} HTML email
 */

const { baseTemplate } = require("./baseTemplate");

function reminderTemplate({ taskTitle, dueDate }) {
  return baseTemplate({
    title: "Promemoria Attività",
    content: `
      <p>Hai un'attività che richiede la tua attenzione:</p>

      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
            Scadenza: ${dueDate}
          </span>
        </div>
        <h3 style="margin: 0; color: #111827; font-size: 18px;">${taskTitle}</h3>
      </div>
    `,
  });
}

module.exports = { reminderTemplate };