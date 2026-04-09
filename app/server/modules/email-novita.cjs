/* FILE: app/server/modules/email-novita.cjs */
/**
 * =========================================================
 * File: app/server/modules/email-novita.cjs
 * Newsletter “Novità” basata su tabella prodotti (SQL)
 * PATCH 2026.70 — Dominio corretto .it + link ID-based
 * + TEMPLATE GRAFICO UNIVERSALE
 * + PATCH AI: usa descrizione_email se presente
 * + FIREWALL: tipo "novita" (1/settimana)
 * + STOP se nessun prodotto / descrizione vuota / prodotto già inviato
 * + PATCH 2026: Flag persistente "email_novita" per destinatario
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluti
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { LISTA_NEWSLETTER } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));
const { SENDER_VENDITE } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

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
========================================================= */
function generateNovitaHTML(prod) {
  const titolo = escapeHTML(prod.titolo_breve || prod.titolo || "");

  const descrizione = escapeHTML(
    prod.descrizione_email ||
    prod.descrizione_breve ||
    prod.descrizione_lunga ||
    ""
  );

  const immagine = safeString(prod.immagine_url || prod.immagine || "");
  const link = `https://mewingmarket.it/prodotto.html?id=${prod.id}`;

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
      ${contenutoOriginale}
    </div>

    <div style="text-align:center;margin-top:30px;">
      <a href="https://www.facebook.com/profile.php?id=61584779793628"><i class="fab fa-facebook"></i></a>
      <a href="https://www.threads.com/@mewingmarket"><i class="fab fa-threads"></i></a>
      <a href="https://www.instagram.com/mewingmarket?igsh=eGZ2MHE0bTFtbmJt"><i class="fab fa-instagram"></i></a>
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
   INVIO NEWSLETTER NOVITÀ (con firewall)
========================================================= */
async function inviaEmailNovita({ email }) {
  try {
    // 🔥 FIREWALL PERSISTENTE: se questa email ha già ricevuto una "novità", skip
    if (db.hasFlag("email_novita", email)) {
      console.log("[EMAIL-NOVITA] Già inviata novità a:", email);
      return "ALREADY_SENT";
    }

    const stmt = db.prepare(`
      SELECT *
      FROM prodotti
      ORDER BY id DESC
      LIMIT 1
    `);

    const latest = stmt.get();

    if (!latest) {
      console.error("❌ Nessun prodotto → novità non inviata");
      return "NO_PRODUCT";
    }

    const descr = latest.descrizione_email || latest.descrizione_breve || latest.descrizione_lunga;
    if (!descr || descr.trim().length < 10) {
      console.error("❌ Descrizione vuota → novità non inviata");
      return "EMPTY_DESCRIPTION";
    }

    const titolo = safeString(latest.titolo_breve || latest.titolo || "");
    const oggetto = `✨ Novità: è arrivato “${titolo}”`;
    const html = generateNovitaHTML(latest);

    const res = await inviaEmailLista({
      email,
      listId: LISTA_NEWSLETTER,
      subject: oggetto,
      html,
      sender: SENDER_VENDITE,
      tipo: "novita"
    });

    // ✅ Registra flag persistente solo se l'invio non ha lanciato errori
    try {
      db.setFlag("email_novita", email);
    } catch (err) {
      console.error("❌ Errore setFlag email_novita:", err);
    }

    return res;

  } catch (err) {
    console.error("❌ email-novita: errore invio:", err);
  }
}

module.exports = { inviaEmailNovita };
