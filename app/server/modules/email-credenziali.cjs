// app/server/modules/email-credenziali.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");

async function inviaEmailCredenziali({ email, tipo }) {
  const subject = tipo === "email"
    ? "La tua email è stata aggiornata"
    : "La tua password è stata aggiornata";

  const testo = tipo === "email"
    ? "la tua email di accesso è stata aggiornata correttamente."
    : "la tua password è stata aggiornata correttamente.";

  const html = `
  <html>
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        <h1 style="color:#f97316;font-size:22px;margin-bottom:16px;">Aggiornamento credenziali</h1>
        <p>${testo}</p>
        <p>Email account: <strong>${email}</strong></p>
      </div>
    </body>
  </html>
  `;

  await inviaEmailLista({ email, listId: 10, subject, html });
}

module.exports = { inviaEmailCredenziali };
