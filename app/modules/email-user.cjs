// =========================================================
// File: app/modules/email-user.cjs
// Email utente: registrazione + cambio credenziali (Brevo 4.x + ESM)
// =========================================================

import * as brevo from "@getbrevo/brevo";

console.log("EMAIL-USER VERSIONE BREVO 4.x CARICATA");

// Variabili ambiente
const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER;
const senderName = "MewingMarket";

// Inizializzazione client Brevo (nuova sintassi 4.x)
const client = new brevo.TransactionalEmailsApi();
client.apiKey = apiKey;

// ================================================================
// EMAIL: Registrazione + Benvenuto
// ================================================================
export async function sendWelcomeEmail({ email }) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#111;margin-bottom:10px">Benvenuto su MewingMarket 🎉</h2>
    <p>Ciao,</p>
    <p>La tua registrazione è avvenuta con successo.</p>
    <p>Da ora puoi accedere alla tua area riservata, acquistare prodotti e gestire il tuo account.</p>

    <p style="margin-top:16px;">
      <a href="https://mewingmarket.it/login.html"
         style="display:inline-block;padding:10px 16px;background:#007bff;color:#fff;text-decoration:none;border-radius:4px">
         Vai al login
      </a>
    </p>
  </div>
  `;

  await client.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email }],
    subject: "Benvenuto su MewingMarket 🎉",
    htmlContent: html
  });
}

// ================================================================
// EMAIL: Cambio Credenziali
// ================================================================
export async function sendCredentialsChangedEmail({ email }) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333;">
    <h2 style="color:#111;margin-bottom:10px;">Le tue credenziali sono state modificate</h2>
    <p>Ciao,</p>
    <p>Ti confermiamo che i dati di accesso al tuo account MewingMarket sono stati modificati.</p>
    <p>Se non sei stato tu a richiedere questa modifica, contattaci subito.</p>
  </div>
  `;

  await client.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email }],
    subject: "Aggiornamento credenziali account MewingMarket",
    htmlContent: html
  });
}
