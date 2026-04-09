// app/server/modules/email-cambio-email.cjs

const path = require("path");

// ⭐ DEBUG: verifica quale file viene realmente caricato
console.log("DEBUG EMAIL-CAMBIO-EMAIL → FILE CARICATO:", __filename);

// PATCH: require assoluti
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { LISTA_CREDENZIALI } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));
const { SENDER_CREDENZIALI } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

async function inviaEmailCambioEmail({ email }) {
  const subject = "La tua email è stata aggiornata";
  const year = new Date().getFullYear();

  const contenutoOriginale = `
    <h1 style="color:#38bdf8;font-size:22px;margin-bottom:16px;">Email aggiornata</h1>

    <p style="font-size:16px; color:#444;">
      La tua email di accesso è stata aggiornata correttamente.
    </p>

    <p style="margin-top:12px; font-size:16px;">
      Nuova email account: <strong>${email}</strong>
    </p>

    <hr style="margin:24px 0; border-color:#ddd;">

    <p style="font-size:14px; color:#777;">
      Se non hai richiesto questa modifica, contatta subito il supporto.
    </p>
  `;

  const html = `
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

    <!-- LOGO -->
    <div class="logo">
      <img src="https://www.mewingmarket.it/logo.png" alt="MewingMarket">
    </div>

    <!-- CONTENUTO ORIGINALE -->
    <div class="content">
      ${contenutoOriginale}
    </div>

    <!-- SOCIAL -->
    <div class="social">
      <a href="https://www.facebook.com/profile.php?id=61584779793628"><i class="fab fa-facebook"></i></a>
      <a href="https://www.threads.net/@mewingmarket"><i class="fab fa-threads"></i></a>
      <a href="https://www.instagram.com/mewingmarket"><i class="fab fa-instagram"></i></a>
      <a href="https://www.tiktok.com/@mewingmarket"><i class="fab fa-tiktok"></i></a>
      <a href="https://x.com/mewingm8"><i class="fab fa-x-twitter"></i></a>
      <a href="https://www.youtube.com/@mewingmarket2"><i class="fab fa-youtube"></i></a>
      <a href="https://www.linkedin.com/in/simone-griseri-5368a7394"><i class="fab fa-linkedin"></i></a>
    </div>

    <!-- FOOTER -->
    <div class="footer-bottom">
      © ${year} MewingMarket — Prodotti digitali creati con Intelligenza Artificiale.
      Tutti i diritti riservati.
    </div>

  </div>

</body>
</html>
`;

  return inviaEmailLista({
    email,
    listId: LISTA_CREDENZIALI,
    subject,
    html,
    sender: SENDER_CREDENZIALI,
    tipo: "transazionale"
  });
}

module.exports = { inviaEmailCambioEmail };
