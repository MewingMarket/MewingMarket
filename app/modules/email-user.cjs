// =========================================================
// File: app/modules/email-user.cjs
// Email utente: registrazione + cambio credenziali (Brevo)
// =========================================================

const Brevo = require("@getbrevo/brevo");

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER; // email verificata su Brevo
const senderName = "MewingMarket";

// Inizializzazione client Brevo
const client = new Brevo.TransactionalEmailsApi();

// Impostazione API Key (metodo UNIVERSALE, compatibile con tutte le versioni)
client.authentications["apiKey"].apiKey = apiKey;

// Registrazione + benvenuto
async function sendWelcomeEmail({ email }) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333;">
  <h2 style="color:#111;margin-bottom:10px;">Benvenuto su MewingMarket 🎉</h2>
  <p>Ciao,</p>
  <p>La tua registrazione è avvenuta con successo.</p>
  <p>Da ora puoi accedere alla tua area riservata, acquistare prodotti e scaricare i tuoi contenuti in qualsiasi momento.</p>
  <p style="margin-top:16px;">
    <a href="https://mewingmarket.it/login.html"
       style="display:inline-block;padding:10px 16px;background:#007bff;color:#fff;text-decoration:none;border-radius:6px;">
       Vai al login
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
  <h3 style="margin-bottom:6px;">Supporto</h3>
  <p>
    Email: <a href="mailto:supporto@mewingmarket.it">supporto@mewingmarket.it</a><br>
    Sito: <a href="https://mewingmarket.it">https://mewingmarket.it</a>
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

// Cambio credenziali
async function sendCredentialsChangedEmail({ email }) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333;">
  <h2 style="color:#111;margin-bottom:10px;">Le tue credenziali sono state aggiornate</h2>
  <p>Ciao,</p>
  <p>Ti confermiamo che i dati di accesso al tuo account MewingMarket sono stati aggiornati correttamente.</p>
  <p>Se non sei stato tu a richiedere questa modifica, contattaci subito.</p>
  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
  <h3 style="margin-bottom:6px;">Supporto</h3>
  <p>
    Email: <a href="mailto:supporto@mewingmarket.it">supporto@mewingmarket.it</a><br>
    Sito: <a href="https://mewingmarket.it">https://mewingmarket.it</a>
  </p>
</div>
`;

  await client.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email }],
    subject: "Aggiornamento credenziali account MewingMarket",
    htmlContent: html
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCredentialsChangedEmail
};
