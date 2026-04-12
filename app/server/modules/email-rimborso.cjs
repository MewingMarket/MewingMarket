/**
 * =========================================================
 * EMAIL — Rimborso intelligente (risolvibile / non risolvibile)
 * Versione 2026.960 — Unificato
 * =========================================================
 */

const path = require("path");
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { SENDER_VENDITE } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

function generateEmailRimborsoHTML({ tipo, guida, whatsapp }) {
  let contenuto = "";

  if (tipo === "risolvibile") {
    contenuto = `
      <p>Abbiamo analizzato la tua richiesta e il problema è risolvibile.</p>
      <p>${guida}</p>
      <p>Se il problema persiste, rispondi a questa email e ti assisteremo direttamente.</p>
    `;
  }

  if (tipo === "non_risolvibile") {
    contenuto = `
      <p>Abbiamo ricevuto la tua richiesta di rimborso.</p>
      <p>Il nostro team la sta valutando e riceverai una conferma entro poche ore.</p>
      <p>Se hai urgenza, puoi contattarci su WhatsApp: <a href="${whatsapp}">${whatsapp}</a></p>
    `;
  }

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
      <a href="https://www.instagram.com/mewingmarket">Instagram</a> •
      <a href="https://tiktok.com/@mewingmarket">TikTok</a> •
      <a href="https://www.youtube.com/@mewingmarket2">YouTube</a>
    </div>

    <div style="text-align:center;font-size:13px;color:#777;margin-top:25px;padding-top:15px;border-top:1px solid #ddd;">
      © ${new Date().getFullYear()} MewingMarket
    </div>

  </div>

</body>
</html>
`;
}

async function inviaEmailRimborso({ email, tipo, guida }) {
  const html = generateEmailRimborsoHTML({
    tipo,
    guida,
    whatsapp: "https://wa.me/393520266660"
  });

  return await inviaEmailLista({
    email,
    listId: 12,
    subject: "Aggiornamento sulla tua richiesta",
    html,
    sender: SENDER_VENDITE,
    tipo: "rimborso",
    modalita: "normale"
  });
}

module.exports = {
  inviaEmailRimborso,
  generateEmailRimborsoHTML
};
