// app/server/modules/email-newsletter.cjs

const path = require("path");

// PATCH: require assoluti
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { LISTA_NEWSLETTER } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));
const { SENDER_NEWSLETTER } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

async function inviaEmailNewsletterBenvenuto({ email }) {
  const subject = "Benvenuto nella newsletter MewingMarket 👋";

  const contenutoOriginale = `
      <h2 style="text-align:center; color:#333;">Benvenuto in MewingMarket 👋</h2>

      <p style="font-size:16px; color:#444;">
        Abbiamo preparato nuove risorse, contenuti e prodotti digitali pensati per migliorare la tua routine e il tuo benessere.
      </p>

      <h3 style="color:#333;">🌐 Visita il sito ufficiale</h3>
      <p>
        <a href="https://www.mewingmarket.it" 
           style="background:#007bff; color:white; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
           Vai al sito
        </a>
      </p>

      <h3 style="color:#333;">🛒 Esplora lo store digitale</h3>
      <p>
        <a href="https://www.mewingmarket.it/catalogo.html"
           style="background:#28a745; color:white; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
           Vai allo Store
        </a>
      </p>

      <hr style="margin:30px 0;">

      <h3 style="color:#333;">📱 Seguici sui social</h3>
      <p style="color:#444;">Clicca sulle icone per raggiungerci:</p>

      <div style="text-align:left;">
        <a href="https://www.facebook.com/profile.php?id=61584779793628" target="_blank" style="margin-right:10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="32">
        </a>
        <a href="https://www.threads.com/@mewingmarket" target="_blank" style="margin-right:10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/11428/11428186.png" width="32">
        </a>
        <a href="https://www.instagram.com/mewingmarket" target="_blank" style="margin-right:10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="32">
        </a>
        <a href="https://www.tiktok.com/@mewingmarket" target="_blank" style="margin-right:10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="32">
        </a>
        <a href="https://x.com/mewingm8" target="_blank" style="margin-right:10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" width="32">
        </a>
        <a href="https://www.youtube.com/@mewingmarket2" target="_blank" style="margin-right:10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="32">
        </a>
        <a href="https://www.linkedin.com/in/simone-griseri-5368a7394" target="_blank" style="margin-right:10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" width="32">
        </a>
        <a href="https://wa.me/393520266660" target="_blank">
          <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="32">
        </a>
      </div>

      <hr style="margin:30px 0;">

      <p style="font-size:14px; color:#777; text-align:center;">
        Se non vuoi più ricevere email, puoi disiscriverti qui:<br>
        <a href="https://www.mewingmarket.it/disiscriviti.html" style="color:#999; text-decoration:underline;">Disiscriviti</a>
      </p>

      <p style="font-size:12px; color:#555555; margin:0; line-height:1.4;">
        &copy; 2025 <strong>MewingMarket</strong> — Prodotti digitali creati con Intelligenza Artificiale.<br>
        Tutti i diritti riservati.
      </p>
  `;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:10px;border:1px solid #e5e5e5;">
    ${contenutoOriginale}
  </div>
</body>
</html>
`;

  return inviaEmailLista({
    email,
    listId: LISTA_NEWSLETTER,
    subject,
    html,
    sender: SENDER_NEWSLETTER,
    tipo: "transazionale"
  });
}

module.exports = { inviaEmailNewsletterBenvenuto };
