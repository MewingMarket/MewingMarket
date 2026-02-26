// app/server/modules/email-eliminazione.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");

async function inviaEmailEliminazione({ email }) {
  const subject = "Il tuo account è stato eliminato";

  const html = `
  <html>
    <body style="font-family: system-ui; background:#0b1120; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        <h1 style="color:#f87171;font-size:22px;margin-bottom:16px;">Account eliminato</h1>
        <p>Il tuo account è stato eliminato correttamente dai nostri sistemi.</p>
        <p>Se non sei stato tu, contattaci immediatamente.</p>
      </div>
    </body>
  </html>
  `;

  await inviaEmailLista({ email, listId: 9, subject, html });
}

module.exports = { inviaEmailEliminazione };
