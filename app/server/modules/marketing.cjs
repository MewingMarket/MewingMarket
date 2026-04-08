/**
 * =========================================================
 * File: app/server/modules/marketing.cjs
 * Modulo marketing universale — Newsletter + Post-vendita
 * Versione premium 2026
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
</head>

<body style="font-family:Arial,sans-serif;background:#f7f7f7;padding:20px;color:#333;">

<div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:25px;border:1px solid #e5e5e5;">

  <div style="text-align:center;margin-bottom:25px;">
    <img src="https://www.mewingmarket.it/logo.png" alt="MewingMarket" style="width:160px;">
  </div>

  <div style="font-size:16px;line-height:1.6;">
    ${contenuto}
  </div>

  <div style="text-align:center;margin-top:30px;">
    <a href="https://www.facebook.com/profile.php?id=61584779793628"><i class="fab fa-facebook"></i></a>
    <a href="https://www.threads.com/@mewingmarket"><i class="fab fa-threads"></i></a>
    <a href="https://www.instagram.com/mewingmarket"><i class="fab fa-instagram"></i></a>
    <a href="https://tiktok.com/@mewingmarket"><i class="fab fa-tiktok"></i></a>
    <a href="https://x.com/mewingm8"><i class="fab fa-x-twitter"></i></a>
    <a href="https://www.youtube.com/@mewingmarket2"><i class="fab fa-youtube"></i></a>
    <a href="https://www.linkedin.com/in/simone-griseri-5368a7394"><i class="fab fa-linkedin"></i></a>
  </div>

  <div style="text-align:center;font-size:13px;color:#777;margin-top:25px;padding-top:15px;border-top:1px solid #ddd;">
    © ${new Date().getFullYear()} MewingMarket — Prodotti digitali creati con Intelligenza Artificiale.
  </div>

</div>

</body>
</html>
`;
}

/* =========================================================
   GENERA EMAIL PRODOTTO
========================================================= */
function generaEmailProdotto(prod) {
  const titolo = escapeHTML(prod.titolo_breve || prod.titolo || "");
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
  `);
}

/* =========================================================
   NEWSLETTER SETTIMANALE (solo registrati)
   → 1 volta a settimana
   → random prodotto
========================================================= */
async function inviaNewsletterSettimanale(email) {
  const prod = db.prepare(`
    SELECT * FROM prodotti ORDER BY RANDOM() LIMIT 1
  `).get();

  if (!prod) return "NO_PRODUCTS";

  const html = generaEmailProdotto(prod);

  return inviaEmailLista({
    email,
    listId: LISTA_NEWSLETTER,
    subject: `✨ Novità per te: ${prod.titolo_breve || prod.titolo}`,
    html,
    sender: SENDER_VENDITE,
    tipo: "marketing"   // 🔥 1 volta a settimana garantita dal firewall
  });
}

/* =========================================================
   POST-VENDITA SETTIMANALE
   → 1 volta a settimana
   → solo se esiste un correlato
   → quando finiscono → STOP definitivo
========================================================= */
async function inviaPostVenditaSettimanale(email, prodottiAcquistati) {
  const ids = prodottiAcquistati.map(p => p.id);

  // 1) Cerca correlato nella stessa categoria
  let correlato = db.prepare(`
    SELECT * FROM prodotti 
    WHERE categoria = (SELECT categoria FROM prodotti WHERE id = ?)
      AND id NOT IN (${ids.join(",")})
    ORDER BY RANDOM()
    LIMIT 1
  `).get(ids[0]);

  // 2) Fallback: random tra tutti i prodotti non acquistati
  if (!correlato) {
    correlato = db.prepare(`
      SELECT * FROM prodotti 
      WHERE id NOT IN (${ids.join(",")})
      ORDER BY RANDOM()
      LIMIT 1
    `).get();
  }

  // 3) Se non esiste più nulla → STOP definitivo
  if (!correlato) {
    console.log("⛔ Nessun correlato rimasto → stop post-vendita");
    return "NO_MORE_CORRELATI";
  }

  const html = generaEmailProdotto(correlato);

  return inviaEmailLista({
    email,
    listId: LISTA_CLIENTI,
    subject: `Ti potrebbe piacere: ${correlato.titolo_breve || correlato.titolo}`,
    html,
    sender: SENDER_VENDITE,
    tipo: "proposte"   // 🔥 1 volta a settimana garantita dal firewall
  });
}

module.exports = {
  inviaNewsletterSettimanale,
  inviaPostVenditaSettimanale
};
