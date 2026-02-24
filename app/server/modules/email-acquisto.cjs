// app/server/modules/email-acquisto.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");

function renderProdotti(prodotti) {
  return prodotti.map(p => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #1f2937;">${p.titolo}</td>
      <td style="padding:8px;border-bottom:1px solid #1f2937;text-align:right;">${p.prezzo}€</td>
    </tr>
  `).join("");
}

async function inviaEmailAcquisto({ email, ordine }) {
  const subject = `Grazie per il tuo acquisto – Ordine #${ordine.id_ordine}`;

  const html = `
  <html>
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:640px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        <h1 style="color:#22c55e;font-size:24px;">Grazie per il tuo acquisto</h1>
        <p>Ordine <strong>#${ordine.id_ordine}</strong> completato.</p>

        <table style="width:100%;margin-top:16px;border-collapse:collapse;">
          ${renderProdotti(ordine.prodotti)}
        </table>

        <p style="margin-top:16px;"><strong>Totale:</strong> ${ordine.totale}€</p>
      </div>
    </body>
  </html>
  `;

  await inviaEmailLista({ email, listId: 12, subject, html });
}

module.exports = { inviaEmailAcquisto };
