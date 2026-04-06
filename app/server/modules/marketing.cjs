/**
 * =========================================================
 * File: app/server/modules/marketing.cjs
 * Modulo marketing universale — Newsletter + Post-vendita
 * Versione premium 2026
 * PATCH AI: usa descrizione_email come priorità
 * =========================================================
 */

const db = require("../db/database.cjs");
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_NEWSLETTER, LISTA_CLIENTI } = require("./liste-brevo.cjs");
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

function templateEmailUniversale(contenuto) {
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

  <!-- CONTENUTO -->
  <div class="content">
    ${contenuto}
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

  <!-- LINK NEWSLETTER -->
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
}

/* =========================================================
   GENERA EMAIL PRODOTTO
   PATCH AI: usa descrizione_email come priorità
========================================================= */
function generaEmailProdotto(prod) {
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

  return templateEmailUniversale(`
    <h2 style="text-align:center;color:#333;">✨ Scopri “${titolo}”</h2>

    <p style="font-size:16px;color:#444;">
      ${descrizione}
    </p>

    ${
      immagine
        ? `<div style="text-align:center;margin:25px 0;">
             <img src="${immagine}" style="max-width:100%;border-radius:6px;">
           </div>`
        : ""
    }

    <p style="text-align:center;">
      <a href="${link}" 
         style="background:#28a745;color:white;padding:14px 24px;border-radius:6px;text-decoration:none;font-size:16px;display:inline-block;">
         VAI AL PRODOTTO
      </a>
    </p>

    <hr style="margin:30px 0;">

    <h3>❓ Hai dubbi?</h3>
    <p>
      FAQ: <a href="https://www.mewingmarket.it/FAQ.html">https://www.mewingmarket.it/FAQ.html</a><br>
      Guide: <a href="https://www.mewingmarket.it/guide.html">https://www.mewingmarket.it/guide.html</a><br>
      Email supporto: <strong>supporto@mewingmarket.it</strong><br>
      WhatsApp: <strong>+39 352 026 6660</strong>
    </p>
  `);
}

/* =========================================================
   NEWSLETTER SETTIMANALE (random)
========================================================= */
async function inviaNewsletterSettimanale(email) {
  const prod = db.prepare("SELECT * FROM prodotti ORDER BY RANDOM() LIMIT 1").get();
  if (!prod) return;

  const html = generaEmailProdotto(prod);

  return inviaEmailLista({
    email,
    listId: LISTA_NEWSLETTER,
    subject: `✨ Novità per te: ${prod.titolo_breve || prod.titolo}`,
    html,
    sender: SENDER_VENDITE
  });
}

/* =========================================================
   POST-VENDITA SETTIMANALE (correlati → fallback random)
========================================================= */
async function inviaPostVenditaSettimanale(email, prodottiAcquistati) {
  const ids = prodottiAcquistati.map(p => p.id);

  let correlato = db.prepare(`
    SELECT * FROM prodotti 
    WHERE categoria = (SELECT categoria FROM prodotti WHERE id = ?)
      AND id NOT IN (${ids.join(",")})
    ORDER BY RANDOM()
    LIMIT 1
  `).get(ids[0]);

  if (!correlato) {
    correlato = db.prepare(`
      SELECT * FROM prodotti 
      WHERE id NOT IN (${ids.join(",")})
      ORDER BY RANDOM()
      LIMIT 1
    `).get();
  }

  if (!correlato) return;

  const html = generaEmailProdotto(correlato);

  return inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject: `Ti potrebbe piacere: ${correlato.titolo_breve || correlato.titolo}`,
    html,
    sender: SENDER_VENDITE
  });
}

module.exports = {
  inviaNewsletterSettimanale,
  inviaPostVenditaSettimanale
};
