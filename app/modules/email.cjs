// =========================================================
// File: app/modules/email.cjs
// Invio email di ringraziamento ordine (Brevo 4.x + ESM)
// =========================================================

import * as brevo from "@getbrevo/brevo";

console.log("EMAIL-ORDER: Brevo 4.x caricato");

// Variabili ambiente
const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER;
const senderName = "MewingMarket";

// Inizializzazione client Brevo
const client = new brevo.TransactionalEmailsApi();
client.apiKey = apiKey;

/**
 * Invia email di ringraziamento dopo ordine completato
 */
export async function sendOrderEmail({ email, ordine }) {
  const prodottiHTML = ordine.prodotti
    .map(
      p => `
      <li style="margin-bottom:6px;">
        <strong>${p.titolo}</strong> — ${p.prezzo}€
        <br>
        <a href="https://mewingmarket.it/api/vendite/download/${p.slug}"
           style="color:#007bff;">Scarica il prodotto</a>
      </li>
    `
    )
    .join("");

  const html = `
<div style="font-family:Arial, sans-serif; max-width:600px; margin:auto; color:#333;">
  <h2 style="color:#111; margin-bottom:10px;">
    Grazie per il tuo acquisto da MewingMarket! 🎉
  </h2>

  <p>Ciao!</p>
  <p>Abbiamo ricevuto correttamente il tuo ordine.</p>

  <h3>📦 RIEPILOGO ORDINE</h3>
  <ul>${prodottiHTML}</ul>

  <p><strong>Totale:</strong> ${ordine.totale}€</p>
</div>
`;

  await client.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email }],
    subject: "Grazie per il tuo acquisto da MewingMarket! 🎉",
    htmlContent: html
  });
}
