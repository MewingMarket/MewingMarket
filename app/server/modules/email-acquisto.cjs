// =========================================================
// File: app/server/modules/email-acquisto.cjs
// Email acquisto — Versione patchata 2026.2001
// - Link recensioni → pagina Le mie recensioni
// - Social con icone SVG inline
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

  const numeroOrdine = ordine.id_ordine || ordine.id || "SENZA-ID";

  const dataOrdine = ordine.data
    ? new Date(ordine.data).toLocaleDateString("it-IT")
    : new Date().toLocaleDateString("it-IT");

  const prodottiHTML = renderProdotti(ordine.prodotti || []);

  const token = ordine.download_token;

  /* =========================================================
     EMAIL HTML — Versione patchata
  ========================================================== */
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
          <a href="https://mewingmarket.it/recensioni.html"
             style="color:#38bdf8;text-decoration:underline;">
            Lascia una recensione
          </a>
        </p>

        <h2 style="font-size:18px;margin-top:24px;">🌐 SOCIAL</h2>

        <div style="display:flex;gap:12px;align-items:center;margin-top:8px;">

          <!-- Facebook -->
          <a href="https://facebook.com" style="color:#38bdf8;">
            <svg width="22" height="22" fill="#38bdf8" viewBox="0 0 24 24">
              <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12"/>
            </svg>
          </a>

          <!-- Instagram -->
          <a href="https://instagram.com" style="color:#38bdf8;">
            <svg width="22" height="22" fill="#38bdf8" viewBox="0 0 24 24">
              <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.8-.9a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2z"/>
            </svg>
          </a>

          <!-- TikTok -->
          <a href="https://tiktok.com" style="color:#38bdf8;">
            <svg width="22" height="22" fill="#38bdf8" viewBox="0 0 24 24">
              <path d="M12 2h3c.2 1.6 1.3 3 2.8 3.6V9c-1.8-.1-3.5-.8-4.8-2v7.3a5.7 5.7 0 1 1-3-5V12a2.7 2.7 0 1 0 1.2 2.3V2z"/>
            </svg>
          </a>

          <!-- YouTube -->
          <a href="https://youtube.com" style="color:#38bdf8;">
            <svg width="22" height="22" fill="#38bdf8" viewBox="0 0 24 24">
              <path d="M21.8 8.2s-.2-1.5-.8-2.2c-.8-.9-1.7-.9-2.1-1C15.9 4.5 12 4.5 12 4.5h-.1s-3.9 0-6.9.5c-.4.1-1.3.1-2.1 1-.6.7-.8 2.2-.8 2.2S2 9.9 2 11.6v1.7c0 1.7.2 3.4.2 3.4s.2 1.5.8 2.2c.8.9 1.9.9 2.4 1 1.7.2 7 .5 7 .5s3.9 0 6.9-.5c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.2.8-2.2s.2-1.7.2-3.4v-1.7c0-1.7-.2-3.4-.2-3.4zM10 14.7V9.3l5.2 2.7L10 14.7z"/>
            </svg>
          </a>

        </div>

      </div>
    </body>
  </html>
  `;

  /* =========================================================
     UNA SOLA RICEVUTA FISCALE
  ========================================================== */
  const ordineConEmail = { ...ordine, email };
  const { pdfCliente, pdfInterno } = await generaRicevuteFiscali(ordineConEmail);

  const allegatiCliente = [
    {
      filename: `ricevuta-ordine-${numeroOrdine}.pdf`,
      content: pdfCliente,
      mimeType: "application/pdf"
    }
  ];

  /* =========================================================
     EMAIL CLIENTE
  ========================================================== */
  await inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject: "Grazie per il tuo acquisto da MewingMarket! 🎉",
    html,
    sender: SENDER_ACQUISTI,
    attachments: allegatiCliente
  });

  /* =========================================================
     EMAIL INTERNA (PATCH COMPLETA)
  ========================================================== */
  const htmlOwner = `
    <p><strong>Nuovo ordine MewingMarket</strong></p>
    <p>Ordine #${numeroOrdine} da <strong>${email}</strong></p>
    <p>Totale: <strong>${ordine.totale}€</strong></p>
    <p>Codice fiscale cliente: <strong>${ordine.codice_fiscale || "-"}</strong></p>
    <p>Prodotti:</p>
    <ul>
      ${ordine.prodotti
        .map(
          p =>
            `<li>${p.titolo} — ${(p.prezzo_cent / 100).toFixed(2)}€</li>`
        )
        .join("")}
    </ul>
    <p>In allegato trovi la ricevuta fiscale.</p>
  `;

  await inviaEmailLista({
    email: EMAIL_OWNER,
    listId: LISTA_CLIENTI,
    subject: `Nuovo ordine #${numeroOrdine}`,
    html: htmlOwner,
    sender: SENDER_ACQUISTI,
    attachments: [
      {
        filename: `ricevuta-ordine-${numeroOrdine}.pdf`,
        content: pdfInterno,
        mimeType: "application/pdf"
      }
    ]
  });

  return true;
}

module.exports = { inviaEmailAcquisto };
