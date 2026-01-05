/**
 * Template base HTML per tutte le email Nimbus.
 *
 * @param {Object} params
 * @param {string} params.title - Titolo dell'email
 * @param {string} params.content - Contenuto HTML principale
 * @returns {string} HTML email completo
 */

function baseTemplate({ title, content }) {
  return `
  <div style="
    font-family: Inter, Arial, sans-serif;
    background-color: #f5f7fb;
    padding: 30px;
  ">
    <div style="
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    ">
      <div style="
        background: linear-gradient(135deg, #1e3a8a, #312e81);
        padding: 20px;
        color: white;
      ">
        <h2 style="margin: 0;">Nimbus</h2>
        <p style="margin: 4px 0 0; opacity: 0.9;">${title}</p>
      </div>

      <div style="padding: 24px; color: #111827; font-size: 15px;">
        ${content}
      </div>

      <div style="
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        background: #f9fafb;
      ">
        © ${new Date().getFullYear()} Nimbus · Cloud Productivity Platform
      </div>
    </div>
  </div>
  `;
}

module.exports = { baseTemplate };
