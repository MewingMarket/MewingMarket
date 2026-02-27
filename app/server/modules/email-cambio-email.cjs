// app/server/modules/email-cambio-email.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_CREDENZIALI } = require("./liste-brevo.cjs");
const { SENDER_CREDENZIALI } = require("./email-senders.cjs");

async function inviaEmailCambioEmail({ email }) {
  const subject = "La tua email è stata aggiornata";

  const html = `
  <html lang="it">
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        
        <h1 style="color:#38bdf8;font-size:22px;margin-bottom:16px;">Email aggiornata</h1>

        <p style="font-size:16px; color:#e5e7eb;">
          La tua email di accesso è stata aggiornata correttamente.
        </p>

        <p style="margin-top:12px; font-size:16px;">
          Nuova email account: <strong>${email}</strong>
        </p>

        <hr style="margin:24px 0; border-color:#1f2937;">

        <p style="font-size:14px; color:#9ca3af;">
          Se non hai richiesto questa modifica, contatta subito il supporto.
        </p>

      </div>
    </body>
  </html>
  `;

  return inviaEmailLista({
    email,
    listId: LISTA_CREDENZIALI,   // ID 10
    subject,
    html,
    sender: SENDER_CREDENZIALI   // supporto@mewingmarket.it
  });
}

module.exports = { inviaEmailCambioEmail };
