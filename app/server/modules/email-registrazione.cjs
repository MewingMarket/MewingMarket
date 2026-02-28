// app/server/modules/email-registrazione.cjs
const { inviaEmailLista } = require("./invia-email-lista.cjs");
const { LISTA_REGISTRATI } = require("./liste-brevo.cjs");
const { SENDER_VENDITE } = require("./email-senders.cjs");

async function inviaEmailRegistrazione({ email }) {
  const subject = "Benvenuto su MewingMarket 👋";

  const html = `
<!DOCTYPE html>
<html lang="it">
<body>
<div style="font-family:Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; line-height:1.6;">

  <!-- LOGO -->
  <div style="text-align:center; margin-bottom:25px;">
    <img src="https://i.ibb.co/35J1n37X/AZs-ERch-6-Fz-Ziggb-HFCSA-AZs-ERch-3-XKzqhgk-AXmbbg-20251209-190133-0000.jpg" 
         alt="MewingMarket" 
         style="max-width:100%; border-radius:6px;">
  </div>

  <h2 style="text-align:center; color:#333;">Benvenuto in MewingMarket 👋</h2>

  <p style="font-size:16px; color:#444;">
    La tua registrazione è avvenuta con successo.  
    Da ora puoi accedere alla tua area riservata usando:
  </p>

  <p style="font-size:18px; color:#000; margin-top:10px;">
    <strong>${email}</strong>
  </p>

  <hr style="margin:30px 0;">

  <!-- LINK LOGIN -->
  <h3 style="color:#333;">🔐 Accedi al tuo account</h3>
  <p>
    <a href="https://www.mewingmarket.it/login.html" 
       style="background:#007bff; color:white; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
       Vai al Login
    </a>
  </p>

  <hr style="margin:30px 0;">

  <!-- SOCIAL -->
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

  <!-- FOOTER -->
  <p style="font-size:14px; color:#777; text-align:center;">
    Se non vuoi più ricevere email, puoi disiscriverti qui:<br>
    <a href="https://www.mewingmarket.it/disiscriviti.html" style="color:#999; text-decoration:underline;">Disiscriviti</a>
  </p>

</div>

<p style="font-size:12px; color:#555; margin:0; line-height:1.4;">
  &copy; 2025 <strong>MewingMarket</strong> — Prodotti digitali creati con Intelligenza Artificiale.<br>
  Tutti i diritti riservati.
</p>

</body>
</html>
`;

  return inviaEmailLista({
    email,
    listId: LISTA_REGISTRATI,   // ID 9
    subject,
    html,
    sender: SENDER_VENDITE      // vendite@mewingmarket.it
  });
}

module.exports = { inviaEmailRegistrazione };
