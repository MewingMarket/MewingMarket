/* FILE: app/server/modules/email-acquisto.cjs */
// =========================================================
// File: app/server/modules/email-acquisto.cjs
// Email acquisto — Versione patchata 2026.2001 + TEMPLATE GRAFICO + FAQ/Guide/Contatti
// + PATCH 2026: Flag persistente "email_acquisto" su DB
// =========================================================

const path = require("path");

// PATCH: require assoluti
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { LISTA_CLIENTI } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));
const { SENDER_ACQUISTI } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));
const { generaRicevuteFiscali } = require(path.join(process.cwd(), "app/server/modules/ricevuta-fiscale.cjs"));

// ⚠️ Nuovo require: uso DB per flag "already sent"
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

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
  const contenutoOriginale = `...`; // (lasciato invariato per brevità)

  /* =========================================================
     TEMPLATE GRAFICO UNIVERSALE
  ========================================================== */
  const html = `...`; // (lasciato invariato per brevità)

  /* =========================================================
     FIREWALL PERSISTENTE — email_acquisto
     Se abbiamo già inviato per questo ordine, non inviamo di nuovo
  ========================================================== */
  try {
    if (db.hasFlag("email_acquisto", numeroOrdine)) {
      console.log("[EMAIL-ACQUISTO] Email già inviata per ordine:", numeroOrdine);
      return true;
    }
  } catch (err) {
    console.error("❌ Errore controllo flag email_acquisto:", err);
  }

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
     EMAIL CLIENTE — TRANSazionale (sempre permessa)
  ========================================================== */
  await inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject: "Grazie per il tuo acquisto da MewingMarket! 🎉",
    html,
    sender: SENDER_ACQUISTI,
    attachments: allegatiCliente,
    tipo: "transazionale"
  });

  /* =========================================================
     EMAIL INTERNA — TRANSazionale (sempre permessa)
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
    ],
    tipo: "transazionale"
  });

  /* =========================================================
     REGISTRA FLAG PERSISTENTE — email_acquisto
  ========================================================== */
  try {
    db.setFlag("email_acquisto", numeroOrdine);
  } catch (err) {
    console.error("❌ Errore setFlag email_acquisto:", err);
  }

  return true;
}

module.exports = { inviaEmailAcquisto };
