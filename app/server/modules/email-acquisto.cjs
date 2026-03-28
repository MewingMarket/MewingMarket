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
   INVIO EMAIL ACQUISTO
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
        <p style="margin:0 0 4px 0;">Ciao!</p>
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

        <h2 style="font-size:18px;margin-bottom:8px;">📥 ISTRUZIONI RAPIDE</h2>
        <p style="margin:0 0 4px 0;">1. Scarica il file dal link che hai ricevuto al momento del pagamento o dalla tua area download.</p>
        <p style="margin:0 0 4px 0;">2. Salvalo sul tuo dispositivo.</p>
        <p style="margin:0 0 12px 0;">3. Segui le indicazioni contenute nel PDF o nel materiale incluso.</p>

        <p style="margin:0 0 12px 0;">
          Puoi accedere in qualsiasi momento alla tua area download da qui:<br>
          <a href="https://mewingmarket.it/download.html" 
             style="color:#38bdf8;text-decoration:underline;">
            https://mewingmarket.it/download.html
          </a>
        </p>

        <p style="margin:0 0 16px 0;">
          Se hai dubbi o difficoltà, siamo sempre disponibili.
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">🧾 NOTE FISCALI</h2>
        <p style="margin:0 0 12px 0;">
          La ricevuta è emessa come prestazione occasionale ai sensi della normativa italiana.<br>
          In allegato trovi la tua ricevuta in PDF.<br>
          Se ti serve una copia aggiuntiva o personalizzata, rispondi direttamente a questa email.
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">⭐ LASCIA UNA RECENSIONE</h2>
        <p style="margin:0 0 12px 0;">
          Il tuo feedback è prezioso:<br>
          👉 <a href="https://mewingmarket.it/recensioni.html" 
                style="color:#38bdf8;text-decoration:underline;">
               https://mewingmarket.it/recensioni.html
             </a>
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">🎁 RISORSE ESCLUSIVE</h2>
        <p style="margin:0 0 4px 0;">
          Iscriviti per ricevere contenuti utili e aggiornamenti:<br>
          <a href="https://mewingmarket.it/iscrizione.html" 
             style="color:#38bdf8;text-decoration:underline;">
            https://mewingmarket.it/iscrizione.html
          </a>
        </p>
        <p style="margin:0 0 12px 0;">
          Disiscriviti:<br>
          <a href="https://mewingmarket.it/disiscriviti.html" 
             style="color:#38bdf8;text-decoration:underline;">
            https://mewingmarket.it/disiscriviti.html
          </a>
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">📞 CONTATTI</h2>
        <p style="margin:0 0 4px 0;">Email supporto: <a href="mailto:supporto@mewingmarket.it" style="color:#38bdf8;">supporto@mewingmarket.it</a></p>
        <p style="margin:0 0 4px 0;">WhatsApp Business: +39 352 026 6660</p>
        <p style="margin:0 0 12px 0;">Sito ufficiale: <a href="https://mewingmarket.it" style="color:#38bdf8;">https://mewingmarket.it</a></p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0;" />

        <h2 style="font-size:18px;margin-bottom:8px;">🌐 SOCIAL</h2>
        <p style="margin:0 0 4px 0;">
          Facebook: <a href="https://www.facebook.com/profile.php?id=61584779793628" style="color:#38bdf8;">link</a><br>
          Instagram: <a href="https://www.instagram.com/mewingmarket" style="color:#38bdf8;">link</a><br>
          TikTok: <a href="https://www.tiktok.com/@mewingmarket" style="color:#38bdf8;">link</a><br>
          YouTube: <a href="https://www.youtube.com/@mewingmarket2" style="color:#38bdf8;">link</a><br>
          Threads: <a href="https://www.threads.net/@mewingmarket" style="color:#38bdf8;">link</a><br>
          X (Twitter): <a href="https://x.com/mewingm8" style="color:#38bdf8;">link</a><br>
          LinkedIn: <a href="https://www.linkedin.com/in/simone-griseri-5368a7394" style="color:#38bdf8;">link</a>
        </p>

      </div>
    </body>
  </html>
  `;

  // =========================================================
  // PDF RICEVUTE
  // =========================================================
  const ordineConEmail = { ...ordine, email };
  const {
    pdfCliente,
    pdfInternoSenzaBollo,
    pdfInternoConBollo
  } = await generaRicevuteFiscali(ordineConEmail);

  // 1) EMAIL AL CLIENTE
  await inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject,
    html,
    sender: SENDER_ACQUISTI,
    attachments: [
      {
        filename: `ricevuta-ordine-${ordine.id_ordine || ordine.id || "mewingmarket"}.pdf`,
        content: pdfCliente,
        mimeType: "application/pdf"
      }
    ]
  });

  // 2) EMAIL INTERNA A TE
  const htmlOwner = `
    <html>
      <body style="font-family: system-ui; background:#020617; color:#e5e7eb; padding:24px;">
        <div style="max-width:640px;margin:0 auto;border-radius:16px;border:1px solid #1f2937;padding:24px;background:#111827;">
          <h1 style="color:#22c55e;font-size:22px;margin-bottom:8px;">Nuovo ordine MewingMarket</h1>
          <p>Ordine <strong>#${ordine.id_ordine}</strong> da <strong>${email}</strong>, totale ${ordine.totale}€.</p>
          <p>In allegato trovi le ricevute interne (con e senza marca da bollo).</p>
        </div>
      </body>
    </html>
  `;

  await inviaEmailLista({
    email: EMAIL_OWNER,
    listId: LISTA_CLIENTI,
    subject: `Nuovo ordine #${ordine.id_ordine} – ricevute fiscali`,
    html: htmlOwner,
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
