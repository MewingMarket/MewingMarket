// app/server/modules/email-cambio-email.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");

async function inviaEmailCambioEmail({ email }) {
  const subject = "La tua email è stata aggiornata";

  const html = `
  <html>
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        <h1 style="color:#38bdf8;font-size:22px;margin-bottom:16px;">Email aggiornata</h1>
        <p>La tua email di accesso è stata aggiornata correttamente.</p>
        <p>Nuova email account: <strong>${email}</strong></p>
      </div>
    </body>
  </html>
  `;

  await inviaEmailLista({ email, listId: 9, subject, html });
}

module.exports = { inviaEmailCambioEmail };
