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

function taskReminderTemplate({ taskTitle, dueDate }) {
  return baseTemplate({
    title: "Scadenza Imminente",
    content: `
      <p style="text-align: center; font-size: 16px;">Attenzione! Il tempo sta per scadere per questa attività:</p>
      
      <div style="background: #fff1f2; border: 2px solid #fecaca; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 20px;">${taskTitle}</h3>
        <p style="margin: 0; color: #dc2626; font-weight: bold;">Scade il: ${dueDate}</p>
      </div>

      <p style="font-size: 14px; text-align: center; color: #6b7280;">
        Ti consigliamo di completare il task il prima possibile per mantenere alta la tua produttività.
      </p>
    `,
  });
}

module.exports = { taskReminderTemplate };