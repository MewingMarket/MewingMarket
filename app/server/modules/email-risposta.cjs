/**
 * =========================================================
 * TEMPLATE EMAIL RISPOSTA ASSISTENZA — Versione 2026.995
 * - Stile premium unificato (come email-registrazione.cjs)
 * - Include logo, risposta AI, contatti, social, footer
 * =========================================================
 */

function templateEmailRisposta({ rispostaAI }) {
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
    .content { font-size:16px; line-height:1.6; color:#333; }
    .social { text-align:center; margin-top:30px; }
    .social a { margin:0 8px; font-size:22px; color:#333; text-decoration:none; }
    .footer-bottom { text-align:center; font-size:13px; color:#777; margin-top:25px; padding-top:15px; border-top:1px solid #ddd; }
    a { color:#0066cc; }
  </style>
</head>

<body>

  <div class="email-container">

    <!-- LOGO -->
    <div class="logo">
      <img src="https://www.mewingmarket.it/logo.png" alt="MewingMarket">
    </div>

    <!-- RISPOSTA AI -->
    <div class="content">
      ${rispostaAI}
    </div>

    <!-- CHIARIMENTI -->
    <div class="content" style="margin-top:25px;">
      Se hai bisogno di ulteriori chiarimenti puoi visitare la pagina contatti:<br>
      <a href="https://www.mewingmarket.it/contatti.html">
        https://www.mewingmarket.it/contatti.html
      </a>
    </div>

    <!-- SOCIAL -->
    <div class="social">
      <a href="https://www.facebook.com/profile.php?id=61584779793628"><i class="fab fa-facebook"></i></a>
      <a href="https://www.threads.com/@mewingmarket"><i class="fab fa-threads"></i></a>
      <a href="https://www.instagram.com/mewingmarket"><i class="fab fa-instagram"></i></a>
      <a href="https://tiktok.com/@mewingmarket"><i class="fab fa-tiktok"></i></a>
      <a href="https://x.com/mewingm8"><i class="fab fa-x-twitter"></i></a>
      <a href="https://www.youtube.com/@mewingmarket2"><i class="fab fa-youtube"></i></a>
      <a href="https://www.linkedin.com/in/simone-griseri-5368a7394"><i class="fab fa-linkedin"></i></a>
    </div>

    <!-- FOOTER -->
    <div class="footer-bottom">
      © <span id="anno"></span> MewingMarket — Prodotti digitali creati con Intelligenza Artificiale.<br>
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

module.exports = { templateEmailRisposta };
