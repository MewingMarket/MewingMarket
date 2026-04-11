/**
 * =========================================================
 * EMAIL — Ordine in attesa pagamento
 * Versione 2026.950
 * Template premium con logo + social
 * =========================================================
 */

const path = require("path");
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { SENDER_VENDITE } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

/* =========================================================
   TEMPLATE HTML PREMIUM
========================================================= */
function generateEmailAttesaHTML({ url }) {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body style="font-family:Arial,sans-serif;background:#f7f7f7;padding:20px;color:#333;">

  <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:25px;border:1px solid #e5e5e5;">

    <!-- LOGO -->
    <div style="text-align:center;margin-bottom:25px;">
      <img src="https://www.mewingmarket.it/logo.png" alt="MewingMarket" style="width:160px;">
    </div>

    <!-- CONTENUTO -->
    <div style="font-size:16px;line-height:1.6;">
      <h2 style="text-align:center;color:#333;">Completa il tuo acquisto</h2>

      <p style="font-size:16px;color:#444;">
        Il tuo ordine risulta ancora <strong>in attesa di pagamento</strong>.
      </p>

      <p style="font-size:16px;color:#444;">
        Puoi completarlo cliccando sul pulsante qui sotto:
      </p>

      <p style="text-align:center;margin:30px 0;">
        <a href="${url}"
           style="background:#0077ff;color:white;padding:14px 24px;border-radius:6px;text-decoration:none;font-size:16px;display:inline-block;">
           Completa il pagamento →
        </a>
      </p>

      <p style="font-size:15px;color:#444;">
        Hai dubbi o problemi?  
        <a href="https://mewingmarket.it/assistenza.html" style="color:#0077ff;text-decoration:underline;">
          Vai all’assistenza
        </a>
      </p>
    </div>

    <!-- SOCIAL -->
    <div style="text-align:center;margin-top:30px;">
      <a href="https://www.facebook.com/profile.php?id=61584779793628">Facebook</a> •
      <a href="https://www.instagram.com/mewingmarket">Instagram</a> •
      <a href="https://tiktok.com/@mewingmarket">TikTok</a> •
      <a href="https://www.youtube.com/@mewingmarket2">YouTube</a>
    </div>

    <!-- FOOTER -->
    <div style="text-align:center;font-size:13px;color:#777;margin-top:25px;padding-top:15px;border-top:1px solid #ddd;">
      © ${new Date().getFullYear()} MewingMarket — Prodotti digitali creati con Intelligenza Artificiale.
    </div>

  </div>

</body>
</html>
`;
}

/* =========================================================
   INVIO EMAIL
========================================================= */
async function inviaEmailAttesa({ email, url }) {
  const html = generateEmailAttesaHTML({ url });

  return await inviaEmailLista({
    email,
    listId: 12,
    subject: "Completa il tuo acquisto",
    html,
    sender: SENDER_VENDITE,
    tipo: "ordine_in_attesa",
    modalita: "normale"
  });
}

module.exports = {
  inviaEmailAttesa,
  generateEmailAttesaHTML
};
