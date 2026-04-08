// app/server/modules/email-registrazione.cjs

const path = require("path");

// PATCH: require assoluti
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { LISTA_REGISTRATI } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));
const { SENDER_VENDITE } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

async function inviaEmailRegistrazione({ email }) {
  const subject = "Benvenuto su MewingMarket 👋";

  /* =========================================================
     CONTENUTO ORIGINALE (NON MODIFICATO)
  ========================================================== */
  const contenutoOriginale = `
      <h2 style="text-align:center; color:#333;">Benvenuto in MewingMarket 👋</h2>

      <p style="font-size:16px; color:#444;">
        La tua registrazione è avvenuta con successo.  
        Da ora puoi accedere alla tua area riservata usando:
      </p>

      <p style="font-size:18px; color:#000; margin-top:10px;">
        <strong>${email}</strong>
      </p>

      <hr style="margin:30px 0;">

      <h3 style="color:#333;">🔐 Accedi al tuo account</h3>
      <p>
        <a href="https://www.mewingmarket.it/login.html" 
           style="background:#007bff; color:white; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
           Vai al Login
        </a>
      </p>

      <hr style="margin:30px 0;">

      <h3 style="color:#333;">📱 Seguici sui social</h3>
      <p style="color:#444;">Contenuti quotidiani, zero fuffa:</p>

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
  `;

  /* =========================================================
     TEMPLATE GRAFICO UNIVERSALE
  ========================================================== */
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
    .nl-links { margin-top:20px; text-align:center; font-size:14px; }
    .nl-links a { color:#0066cc; text-decoration:none; display:block; margin:5px 0; }
    .footer-bottom { text-align:center; font-size:13px; color:#777; margin-top:25px; padding-top:15px; border-top:1px solid #ddd; }
  </style>
</head>

<body>

  <div class="email-container">

    <div class="logo">
      <img src="https://www.mewingmarket.it/logo.png" alt="MewingMarket">
    </div>

    <div class="content">
      ${contenutoOriginale}
    </div>

    <div class="social">
      <a href="https://www.facebook.com/profile.php?id=61584779793628"><i class="fab fa-facebook"></i></a>
      <a href="https://www.threads.com/@mewingmarket"><i class="fab fa-threads"></i></a>
      <a href="https://www.instagram.com/mewingmarket?igsh=eGZ2MHE0bTFtbmJt"><i class="fab fa-instagram"></i></a>
      <a href="https://tiktok.com/@mewingmarket"><i class="fab fa-tiktok"></i></a>
      <a href="https://x.com/mewingm8"><i class="fab fa-x-twitter"></i></a>
      <a href="https://www.youtube.com/@mewingmarket2"><i class="fab fa-youtube"></i></a>
      <a href="https://www.linkedin.com/in/simone-griseri-5368a7394"><i class="fab fa-linkedin"></i></a>
    </div>

    <div class="nl-links">
      <a href="https://www.mewingmarket.it/iscrizione.html">Iscriviti alla newsletter</a>
      <a href="https://www.mewingmarket.it/disiscriviti.html">Annulla iscrizione</a>
    </div>

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

  return inviaEmailLista({
    email,
    listId: LISTA_REGISTRATI,
    subject,
    html,
    sender: SENDER_VENDITE,
    tipo: "transazionale"
  });
}

module.exports = { inviaEmailRegistrazione };
