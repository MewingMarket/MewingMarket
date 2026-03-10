// app/server/modules/email-novita.cjs
const path = require("path");
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_NEWSLETTER } = require("./liste-brevo.cjs");
const { SENDER_VENDITE } = require("./email-senders.cjs");
const { getProducts } = require(path.join(__dirname, "airtable-sync.cjs"));
const { safeText, cleanURL } = require(path.join(__dirname, "utils.cjs"));

/* =========================================================
   FUNZIONI DI SICUREZZA
========================================================= */
function safeProducts() {
  try {
    const p = getProducts();
    return Array.isArray(p) ? p : [];
  } catch (err) {
    console.error("email-novita: errore getProducts:", err);
    return [];
  }
}

function safeString(v) {
  return typeof v === "string" ? v : (v == null ? "" : String(v));
}

/* =========================================================
   GENERA HTML NEWSLETTER NOVITÀ
========================================================= */
function generateNovitaHTML(latest) {
  const titolo = safeString(latest.titoloBreve || latest.titolo);
  const descrizione = safeString(latest.descrizioneBreve || latest.descrizione || "");
  const immagine = cleanURL(latest.immagine);
  const link = cleanURL(latest.linkPayhip);

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

  <h2 style="text-align:center; color:#333; margin-top:35px;">🔥 È arrivato “${safeText(titolo)}”</h2>

  <p style="font-size:16px; color:#444;">
    ${safeText(descrizione)}
  </p>

  <div style="text-align:center; margin:25px 0;">
    <img src="${immagine}" 
         alt="${safeText(titolo)}" 
         style="max-width:100%; border-radius:6px;">
  </div>

  <p style="text-align:center;">
    <a href="${link}?utm_source=brevo&utm_campaign=novita&utm_medium=email" 
       style="background:#28a745; color:white; padding:14px 24px; border-radius:6px; text-decoration:none; font-size:16px; display:inline-block;">
       SCOPRI IL NUOVO CONTENUTO
    </a>
  </p>

  <hr style="margin:30px 0;">

  <p style="font-size:14px; color:#777; text-align:center;">
    Se non vuoi più ricevere email, puoi disiscriverti qui:<br>
    <a href="https://mewingmarket.it/disiscriviti.html" style="color:#999; text-decoration:underline;">Disiscriviti</a>
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
    const products = safeProducts();
    const latest = products.length ? products[products.length - 1] : null;

    if (!latest) {
      return inviaEmailLista({
        email,
        listId: LISTA_NEWSLETTER,
        subject: "Novità dal mondo digitale",
        html: "<p>Nessun prodotto disponibile.</p>",
        sender: SENDER_VENDITE
      });
    }

    const titolo = safeString(latest.titoloBreve || latest.titolo);
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
    console.error("email-novita: errore invio:", err);
  }
}

module.exports = { inviaEmailNovita };
