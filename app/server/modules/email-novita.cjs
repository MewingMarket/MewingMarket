/**
 * =========================================================
 * File: app/server/modules/email-novita.cjs
 * Newsletter “Novità” basata su tabella prodotti (SQL)
 * PATCH 2026.60 — ID-based + link corretto prodotto.html?id=&utm_
 * =========================================================
 */

const db = require("../db/database.cjs");
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_NEWSLETTER } = require("./liste-brevo.cjs");
const { SENDER_VENDITE } = require("./email-senders.cjs");

/* =========================================================
   UTILS
========================================================= */
function safeString(v) {
  return typeof v === "string" ? v : (v == null ? "" : String(v));
}

function escapeHTML(str) {
  return safeString(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================================================
   GENERA HTML NEWSLETTER NOVITÀ
   PATCH: link ID-based → prodotto.html?id=<ID>
   FIX: UTM con & invece di ?
========================================================= */
function generateNovitaHTML(prod) {
  const titolo = escapeHTML(prod.titolo_breve || prod.titolo || "");
  const descrizione = escapeHTML(
    prod.descrizione_breve || prod.descrizione_lunga || ""
  );

  const immagine = safeString(prod.immagine_url || "");

  // Link base corretto
  const link = `https://mewingmarket.com/prodotto.html?id=${prod.id}`;

  return `
<html lang="it">
<body>
<div style="font-family:Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; line-height:1.6;">

  <div style="text-align:center; margin-bottom:25px;">
    <img src="https://i.ibb.co/35J1n37X/AZs-ERch-6-Fz-Ziggb-HFCSA-AZs-ERch-3-XKzqhgk-AXmbbg-20251209-190133-0000.jpg" 
         alt="MewingMarket" 
         style="max-width:100%; border-radius:6px;">
  </div>

  <h2 style="text-align:center; color:#333;">✨ Una novità che ti porta un passo avanti</h2>

  <p style="font-size:16px; color:#444;">
    Ogni giorno hai due scelte: restare dove sei o fare un passo in avanti.
  </p>

  <p style="font-size:16px; color:#444;">
    Per questo oggi ti presento qualcosa che può davvero spostarti in avanti.
  </p>

  <h2 style="text-align:center; color:#333; margin-top:35px;">🔥 È arrivato “${titolo}”</h2>

  <p style="font-size:16px; color:#444;">
    ${descrizione}
  </p>

  ${
    immagine
      ? `
  <div style="text-align:center; margin:25px 0;">
    <img src="${immagine}" 
         alt="${titolo}" 
         style="max-width:100%; border-radius:6px;">
  </div>
  `
      : ""
  }

  <p style="text-align:center;">
    <a href="${link}&utm_source=brevo&utm_campaign=novita&utm_medium=email" 
       style="background:#28a745; color:white; padding:14px 24px; border-radius:6px; text-decoration:none; font-size:16px; display:inline-block;">
       SCOPRI IL NUOVO CONTENUTO
    </a>
  </p>

  <hr style="margin:30px 0;">

  <p style="font-size:14px; color:#777; text-align:center;">
    Se non vuoi più ricevere email, puoi disiscriverti qui:<br>
    <a href="https://mewingmarket.com/disiscriviti.html" style="color:#999; text-decoration:underline;">Disiscriviti</a>
  </p>

</div>
</body>
</html>
`;
}

/* =========================================================
   INVIO NEWSLETTER NOVITÀ
========================================================= */
async function inviaEmailNovita({ email }) {
  try {
    const stmt = db.prepare(`
      SELECT *
      FROM prodotti
      ORDER BY id DESC
      LIMIT 1
    `);

    const latest = stmt.get();

    if (!latest) {
      return inviaEmailLista({
        email,
        listId: LISTA_NEWSLETTER,
        subject: "Novità dal mondo digitale",
        html: "<p>Nessun prodotto disponibile.</p>",
        sender: SENDER_VENDITE
      });
    }

    const titolo = safeString(latest.titolo_breve || latest.titolo || "");
    const oggetto = `✨ Novità: è arrivato “${titolo}”`;
    const html = generateNovitaHTML(latest);

    return inviaEmailLista({
      email,
      listId: LISTA_NEWSLETTER,
      subject: oggetto,
      html,
      sender: SENDER_VENDITE
    });

  } catch (err) {
    console.error("❌ email-novita: errore invio:", err);
  }
}

module.exports = { inviaEmailNovita };
