// app/server/modules/email-acquisto.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_CLIENTI } = require("./liste-brevo.cjs");
const { SENDER_ACQUISTI } = require("./email-senders.cjs");
const { generaRicevuteFiscali } = require("./ricevuta-fiscale.cjs");

const EMAIL_OWNER = "mewingmarket2@gmail.com";

/* =========================================================
   RENDER TABELLA PRODOTTI
========================================================= */
function renderProdotti(prodotti) {
  return prodotti
    .map(
      p => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #1f2937;">${p.titolo}</td>
      <td style="padding:8px;border-bottom:1px solid #1f2937;text-align:right;">
        ${p.prezzo}€ ${p.qty ? `× ${p.qty}` : ""}
      </td>
    </tr>
  `
    )
    .join("");
}

/* =========================================================
   INVIO EMAIL ACQUISTO — PATCH 2026
========================================================= */
async function inviaEmailAcquisto({ email, ordine }) {
  const subject = "Grazie per il tuo acquisto da MewingMarket! 🎉";

  const prodottiHTML = renderProdotti(ordine.prodotti || []);
  const dataOrdine = ordine.data
    ? new Date(ordine.data).toLocaleDateString("it-IT")
    : new Date().toLocaleDateString("it-IT");

  const html = `
  <html>
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:640px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
        
        <h1 style="color:#22c55e;font-size:24px;margin-bottom:8px;">
          Grazie per il tuo acquisto da MewingMarket! 🎉
        </h1>

        <p style="margin:0 0 12px 0;">
          Abbiamo ricevuto correttamente il tuo ordine <strong>#${ordine.id_ordine}</strong> del ${dataOrdine}.
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">📦 Riepilogo ordine</h2>

        <table style="width:100%;margin-top:8px;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Prodotto</th>
              <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Prezzo</th>
            </tr>
          </thead>
          <tbody>
            ${prodottiHTML}
          </tbody>
        </table>

        <p style="margin-top:12px;text-align:right;">
          <strong>Totale:</strong> ${ordine.totale}€
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">📥 Download diretto</h2>
        <p style="margin:0 0 12px 0;">Scarica subito i tuoi prodotti:</p>

        ${ordine.prodotti
          .map(
            p => `
          <p>
            <a href="https://mewingmarket.it/api/vendite/download/${p.prodotto_id}?session=${ordine.session}"
               style="color:#38bdf8;text-decoration:underline;">
              Scarica ${p.titolo}
            </a>
          </p>
        `
          )
          .join("")}

        <p style="margin:0 0 12px 0;">
          Oppure accedi alla tua area download:<br>
          <a href="https://mewingmarket.it/download.html" 
             style="color:#38bdf8;text-decoration:underline;">
            https://mewingmarket.it/download.html
          </a>
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">⭐ Lascia una recensione</h2>
        <p style="margin:0 0 12px 0;">
          Il tuo feedback è prezioso:<br>
          <a href="https://mewingmarket.it/recensioni.html"
             style="color:#38bdf8;text-decoration:underline;">
            Vai alla pagina recensioni
          </a>
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">🌐 Social</h2>

        <p style="margin:0 0 12px 0;">
          <a href="https://www.instagram.com/mewingmarket" style="margin-right:12px;">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="28">
          </a>
          <a href="https://www.tiktok.com/@mewingmarket" style="margin-right:12px;">
            <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="28">
          </a>
          <a href="https://www.youtube.com/@mewingmarket2" style="margin-right:12px;">
            <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="28">
          </a>
          <a href="https://x.com/mewingm8" style="margin-right:12px;">
            <img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" width="28">
          </a>
        </p>

      </div>
    </body>
  </html>
  `;

  /* =========================================================
     UNA sola ricevuta fiscale
========================================================= */
  const ordineConEmail = { ...ordine, email };
  const {
    pdfInternoSenzaBollo,
    pdfInternoConBollo
  } = await generaRicevuteFiscali(ordineConEmail);

  const totale = Number(ordine.totale);

  const allegatiCliente =
    totale > 77.47
      ? [
          {
            filename: `ricevuta-ordine-${ordine.id_ordine}.pdf`,
            content: pdfInternoConBollo,
            mimeType: "application/pdf"
          }
        ]
      : [
          {
            filename: `ricevuta-ordine-${ordine.id_ordine}.pdf`,
            content: pdfInternoSenzaBollo,
            mimeType: "application/pdf"
          }
        ];

  // EMAIL CLIENTE
  await inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject,
    html,
    sender: SENDER_ACQUISTI,
    attachments: allegatiCliente
  });

  // EMAIL INTERNA
  await inviaEmailLista({
    email: EMAIL_OWNER,
    listId: LISTA_CLIENTI,
    subject: `Nuovo ordine #${ordine.id_ordine} – ricevute fiscali`,
    html: `<p>Nuovo ordine da ${email}</p>`,
    sender: SENDER_ACQUISTI,
    attachments: [
      {
        filename: `ricevuta-interna-senza-bollo-${ordine.id_ordine}.pdf`,
        content: pdfInternoSenzaBollo,
        mimeType: "application/pdf"
      },
      {
        filename: `ricevuta-interna-con-bollo-${ordine.id_ordine}.pdf`,
        content: pdfInternoConBollo,
        mimeType: "application/pdf"
      }
    ]
  });

  return true;
}

module.exports = { inviaEmailAcquisto };
