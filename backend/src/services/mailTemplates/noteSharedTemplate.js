/**
 * Template email per notifica di condivisione nota.
 *
 * Inviata all'utente a cui una nota è stata condivisa.
 *
 * @param {Object} params
 * @param {string} params.noteTitle - Titolo della nota condivisa
 * @param {string} params.ownerName - Nome dell'utente che ha condiviso
 * @returns {string} HTML email
 */

const { baseTemplate } = require("./baseTemplate");

function noteSharedTemplate({ noteTitle, ownerName }) {
  return baseTemplate({
    title: "Nuova collaborazione",
    content: `
      <p>Ciao!</p>
      <p><strong>${ownerName}</strong> ha condiviso una nota con te su Nimbus. È il momento di collaborare!</p>
      
      <div style="background: #f0f7ff; border: 1px dashed #3b82f6; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <span style="font-size: 24px;">📄</span>
        <h3 style="margin: 10px 0 0; color: #1e3a8a;">${noteTitle}</h3>
      </div>

      <p>Puoi trovare la nota nella sezione <strong>"Condivise con me"</strong> della tua dashboard.</p>
    `,
  });
}

module.exports = { noteSharedTemplate };