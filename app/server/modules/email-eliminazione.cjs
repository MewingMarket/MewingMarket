// app/server/modules/email-eliminazione.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_CREDENZIALI } = require("./liste-brevo.cjs");
const { SENDER_CREDENZIALI } = require("./email-senders.cjs");

async function inviaEmailEliminazione({ email }) {
  const subject = "Il tuo account è stato eliminato";

  const html = `
  <html lang="it">
    <body style="font-family: system-ui; background:#0b1120; color:#e5e7eb; padding:24px;">
      <div style="max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">

        <h1 style="color:#f87171;font-size:22px;margin-bottom:16px;">Account eliminato</h1>

        <p style="font-size:16px; color:#e5e7eb;">
          Il tuo account è stato eliminato correttamente dai nostri sistemi.
        </p>

        <p style="margin-top:12px; font-size:16px;">
          Se non sei stato tu, contattaci immediatamente.
        </p>

        <hr style="margin:24px 0; border-color:#1f2937;">

        <p style="font-size:14px; color:#9ca3af;">
          Questa email è stata inviata automaticamente per motivi di sicurezza.
        </p>

      </div>
    </body>
  </html>
  `;

  return inviaEmailLista({
    email,
    listId: LISTA_CREDENZIALI,   // ID 10 — Credenziali Modificate
    subject,
    html,
    sender: SENDER_CREDENZIALI   // supporto@mewingmarket.it
  });
}

module.exports = { inviaEmailEliminazione };
