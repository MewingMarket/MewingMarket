/**
 * =========================================================
 * File: app/server/modules/email-novita.cjs
 * Newsletter “Novità” basata su tabella prodotti (SQL)
 * PATCH 2026.70 — Dominio corretto .it + link ID-based
 * + TEMPLATE GRAFICO UNIVERSALE
 * + PATCH AI: usa descrizione_email se presente
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
   FIX: dominio corretto .it
   + TEMPLATE GRAFICO UNIVERSALE
   + PATCH AI: descrizione_email
========================================================= */
function generateNovitaHTML(prod) {
  const titolo = escapeHTML(prod.titolo_breve || prod.titolo || "");

  // 🔥 PATCH AI: priorità descrizione_email
  const descrizione = escapeHTML(
    prod.descrizione_email ||
    prod.descrizione_breve ||
    prod.descrizione_lunga ||
    ""
  );

  const immagine = safeString(prod.immagine_url || prod.immagine || "");

  const link = `https://mewingmarket.it/prodotto.html?id=${prod.id}`;

  /* =========================================================
     CONTENUTO ORIGINALE (NON MODIFICATO)
  ========================================================== */
  const contenutoOriginale = `
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
        <a href="https://mewingmarket.it/disiscriviti.html" style="color:#999; text-decoration:underline;">Disiscriviti</a>
      </p>
  `;

  /* =========================================================
     TEMPLATE GRAFICO UNIVERSALE (LOGO + SOCIAL + FOOTER)
  ========================================================== */
  return `
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
    .footer-bottom { text-align:center; font-size:13px; color:#777; margin-top:25px; padding-top:15px; border-top:1px solid #ddd; }
  </style>
</head>

<body>

  <div class="email-container">

    <!-- LOGO UFFICIALE -->
    <div class="logo">
      <img src="https://www.mewingmarket.it/logo.png" alt="MewingMarket">
    </div>

    <!-- CONTENUTO ORIGINALE -->
    <div class="content">
      ${contenutoOriginale}
    </div>

    <!-- SOCIAL UFFICIALI -->
    <div class="social">
      <a href="https://www.facebook.com/profile.php?id=61584779793628"><i class="fab fa-facebook"></i></a>
      <a href="https://www.threads.com/@mewingmarket"><i class="fab fa-threads"></i></a>
      <a href="https://www.instagram.com/mewingmarket?igsh=eGZ2MHE0bTFtbmJt"><i class="fab fa-instagram"></i></a>
      <a href="https://tiktok.com/@mewingmarket"><i class="fab fa-tiktok"></i></a>
      <a href="https://x.com/mewingm8"><i class="fab fa-x-twitter"></i></a>
      <a href="https://www.youtube.com/@mewingmarket2"><i class="fab fa-youtube"></i></a>
      <a href="https://www.linkedin.com/in/simone-griseri-5368a7394"><i class="fab fa-linkedin"></i></a>
    </div>

    <!-- FOOTER LEGALE -->
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
