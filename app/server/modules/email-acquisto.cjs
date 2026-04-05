// =========================================================
// File: app/server/modules/email-acquisto.cjs
// Email acquisto — Versione patchata 2026.2001 + TEMPLATE GRAFICO
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
     TUO HTML ORIGINALE (NON MODIFICATO)
  ========================================================== */
  const contenutoOriginale = `
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
  `;

  /* =========================================================
     TEMPLATE GRAFICO UNIVERSALE (LOGO + SOCIAL + FOOTER)
     + LINK NEWSLETTER (perché email post-acquisto)
  ========================================================== */
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
    crossorigin="anonymous">

  <style>
    body { font-family: Arial, sans-serif; background:#f7f7f7; padding:20px; color:#333; }
    .email-container { max-width:600px; margin:auto; background:#fff; border-radius:10px; padding:25px; border:1px solid #e5e5e5; }
    .logo { text-align:center; margin-bottom:25px; }
    .logo img { width:160px; }
    .content { font-size:16px; line-height:1.6; }
    .social { text-align:center; margin-top:30px; }
    .social a { margin:0 8px; font-size:22px; color:#333; text-decoration:none; }
    .nl-links { margin-top:20px; text-align:center; font-size:14px; }
    .nl-links a { color:#0066cc; text-decoration:none; display:block; margin:5px 0; }
    .footer-bottom { text-align:center; font-size:13px; color:#777; margin-top:25px; padding-top:15px; border-top:1px solid #ddd; }
  </style>
</head>

<body>

  <div class="email-container">

    <!-- LOGO -->
    <div class="logo">
      <img src="https://www.mewingmarket.it/logo.png" alt="MewingMarket">
    </div>

    <!-- CONTENUTO ORIGINALE -->
    <div class="content">
      ${contenutoOriginale}
    </div>

    <!-- SOCIAL -->
    <div class="social">
      <a href="https://www.facebook.com/profile.php?id=61584779793628"><i class="fab fa-facebook"></i></a>
      <a href="https://www.threads.com/@mewingmarket"><i class="fab fa-threads"></i></a>
      <a href="https://www.instagram.com/mewingmarket?igsh=eGZ2MHE0bTFtbmJt"><i class="fab fa-instagram"></i></a>
      <a href="https://tiktok.com/@mewingmarket"><i class="fab fa-tiktok"></i></a>
      <a href="https://x.com/mewingm8"><i class="fab fa-x-twitter"></i></a>
      <a href="https://www.youtube.com/@mewingmarket2"><i class="fab fa-youtube"></i></a>
      <a href="https://www.linkedin.com/in/simone-griseri-5368a7394"><i class="fab fa-linkedin"></i></a>
    </div>

    <!-- LINK NEWSLETTER (solo per acquisto) -->
    <div class="nl-links">
      <a href="https://www.mewingmarket.it/iscrizione.html">Iscriviti alla newsletter</a>
      <a href="https://www.mewingmarket.it/disiscriviti.html">Annulla iscrizione</a>
    </div>

    <!-- FOOTER -->
    <div class="footer-bottom">
      © <span id="anno"></span> MewingMarket — Prodotti digitali creati con Intelligenza Artificiale.
      Tutti i diritti riservati.
    </div>

  </div>

  <script>
    document.getElementById("anno").textContent = new Date().getFullYear();
  </script>

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
     EMAIL INTERNA (rimane identica)
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
