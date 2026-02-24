const { TransactionalEmailsApi } = require("@getbrevo/brevo");

console.log("EMAIL-ORDER: Brevo 4.x caricato");

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER;
const senderName = "MewingMarket";

const client = new TransactionalEmailsApi();
client.apiKey = apiKey;

// EMAIL ORDINE
async function sendOrderEmail({ email, ordine }) {
  const prodottiHTML = ordine.prodotti
    .map(
      p => `
      <li>
        <strong>${p.titolo}</strong> — ${p.prezzo}€
        <br>
        <a href="https://mewingmarket.it/api/vendite/download/${p.slug}">
          Scarica il prodotto
        </a>
      </li>
    `
    )
    .join("");

  const html = `
<div style="font-family:Arial, sans-serif; max-width:600px; margin:auto; color:#333;">
  <h2>Grazie per il tuo acquisto da MewingMarket! 🎉</h2>
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

module.exports = { sendOrderEmail };
