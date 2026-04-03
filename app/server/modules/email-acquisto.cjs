// =========================================================
// File: app/server/modules/email-acquisto.cjs
// Email acquisto — Versione patchata 2026.2000
// - Testo email riscritto come richiesto
// - Prezzo corretto (prezzo_cent)
// - Link recensioni → thankyou.html
// - Download diretto con token monouso
// - Una sola ricevuta fiscale
// =========================================================

const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_CLIENTI } = require("./liste-brevo.cjs");
const { SENDER_ACQUISTI } = require("./email-senders.cjs");
const { generaRicevuteFiscali } = require("./ricevuta-fiscale.cjs");

const EMAIL_OWNER = "mewingmarket2@gmail.com";

/* =========================================================
   RENDER TABELLA PRODOTTI (PATCH prezzo_cent)
========================================================= */
function renderProdotti(prodotti) {
  return prodotti
    .map(p => {
      const prezzo = (p.prezzo_cent / 100).toFixed(2);
      const qty = p.qty || 1;

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #1f2937;">${p.titolo}</td>
          <td style="padding:8px;border-bottom:1px solid #1f2937;text-align:right;">
            ${prezzo}€ × ${qty}
          </td>
        </tr>
      `;
    })
    .join("");
}

/* =========================================================
   INVIO EMAIL ACQUISTO — Versione patchata completa
========================================================= */
async function inviaEmailAcquisto({ email, ordine }) {

  // ID ordine a prova di bomba
  const numeroOrdine = ordine.id_ordine || ordine.id || "SENZA-ID";

  // Data ordine
  const dataOrdine = ordine.data
    ? new Date(ordine.data).toLocaleDateString("it-IT")
    : new Date().toLocaleDateString("it-IT");

  // Tabella prodotti
  const prodottiHTML = renderProdotti(ordine.prodotti || []);

  // Token download monouso (generato in paypal-complete)
  const token = ordine.download_token;

  // =========================================================
  // EMAIL HTML — Testo fornito da te
  // =========================================================
  const html = `
  <html>
    <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
      <div style="max-width:640px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">

        <h1 style="color:#22c55e;font-size:24px;margin-bottom:8px;">
          Grazie per il tuo acquisto da MewingMarket! 🎉
        </h1>

        <p>Ciao!</p>

        <p>
          Abbiamo ricevuto correttamente il tuo ordine 
          <strong>#${numeroOrdine}</strong> del ${dataOrdine}.
        </p>

        <h2 style="font-size:18px;margin-top:24px;">📦 Riepilogo ordine</h2>

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

        <h2 style="font-size:18px;margin-top:24px;">📥 ISTRUZIONI RAPIDE</h2>

        <ol>
          <li>Scarica il file dal link qui sotto o dalla tua area download.</li>
          <li>Salvalo sul tuo dispositivo.</li>
          <li>Segui le indicazioni contenute nel PDF o nel materiale incluso.</li>
        </ol>

        <h3 style="margin-top:16px;">Download diretto:</h3>

        ${ordine.prodotti
          .map(
            p => `
            <p>
              <a href="https://mewingmarket.it/api/vendite/download-direct/${token}"
                 style="color:#38bdf8;text-decoration:underline;">
                Scarica ${p.titolo}
              </a>
            </p>
          `
          )
          .join("")}

        <p>
          Area download:<br>
          <a href="https://mewingmarket.it/download.html" style="color:#38bdf8;">
            https://mewingmarket.it/download.html
          </a>
        </p>

        <h2 style="font-size:18px;margin-top:24px;">🧾 NOTE FISCALI</h2>
        <p>
          La ricevuta è emessa come prestazione occasionale ai sensi della normativa italiana.<br>
          In allegato trovi la tua ricevuta in PDF.
        </p>

        <h2 style="font-size:18px;margin-top:24px;">⭐ LASCIA UNA RECENSIONE</h2>
        <p>
          Il tuo feedback è prezioso:<br>
          <a href="https://mewingmarket.it/thankyou.html?orderId=${numeroOrdine}"
             style="color:#38bdf8;text-decoration:underline;">
            Lascia una recensione
          </a>
        </p>

        <h2 style="font-size:18px;margin-top:24px;">📞 CONTATTI</h2>
        <p>Email supporto: supporto@mewingmarket.it</p>
        <p>WhatsApp Business: +39 352 026 6660</p>

        <h2 style="font-size:18px;margin-top:24px;">🌐 SOCIAL</h2>
        <p>
          Facebook · Instagram · TikTok · YouTube · Threads · X · LinkedIn
        </p>

      </div>
    </body>
  </html>
  `;

  // =========================================================
  // UNA SOLA RICEVUTA FISCALE
  // =========================================================
  const ordineConEmail = { ...ordine, email };
  const { pdfCliente } = await generaRicevuteFiscali(ordineConEmail);

  const allegatiCliente = [
    {
      filename: `ricevuta-ordine-${numeroOrdine}.pdf`,
      content: pdfCliente,
      mimeType: "application/pdf"
    }
  ];

  // =========================================================
  // EMAIL CLIENTE
  // =========================================================
  await inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject: "Grazie per il tuo acquisto da MewingMarket! 🎉",
    html,
    sender: SENDER_ACQUISTI,
    attachments: allegatiCliente
  });

  // =========================================================
  // EMAIL INTERNA
  // =========================================================
  await inviaEmailLista({
    email: EMAIL_OWNER,
    listId: LISTA_CLIENTI,
    subject: `Nuovo ordine #${numeroOrdine}`,
    html: `<p>Nuovo ordine da ${email}</p>`,
    sender: SENDER_ACQUISTI
  });

  return true;
}

module.exports = { inviaEmailAcquisto };
