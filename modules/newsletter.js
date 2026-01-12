// modules/newsletter.js

const { getProducts } = require("./airtable");

function generateNewsletterHTML() {
  const products = getProducts();
  const latest = products.at(-1);

  if (!latest) return "<p>Nessun prodotto disponibile.</p>";

  const titolo = latest.titoloBreve || latest.titolo;
  const descrizione = latest.descrizioneBreve;
  const immagine = latest.immagine;
  const link = latest.linkPayhip;

  const oggetto = `🧠 È arrivato “${titolo}” — Scopri il nuovo contenuto digitale`;

  const html = `
<html lang="it">
<body>
<div style="font-family:Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; line-height:1.6;">

  <!-- LOGO -->
  <div style="text-align:center; margin-bottom:25px;">
    <img src="https://i.ibb.co/35J1n37X/AZs-ERch-6-Fz-Ziggb-HFCSA-AZs-ERch-3-XKzqhgk-AXmbbg-20251209-190133-0000.jpg" 
         alt="MewingMarket" 
         style="max-width:100%; border-radius:6px;">
  </div>

  <!-- MESSAGGIO -->
  <h2 style="text-align:center; color:#333;">🧠 È arrivato “${titolo}”</h2>
  <p style="font-size:16px; color:#444;">
    ${descrizione}
  </p>

  <!-- IMMAGINE PRODOTTO -->
  <div style="text-align:center; margin:25px 0;">
    <img src="${immagine}" 
         alt="${titolo}" 
         style="max-width:100%; border-radius:6px;">
  </div>

  <!-- LINK PRODOTTO -->
  <p style="text-align:center;">
    <a href="${link}?utm_source=brevo&utm_campaign=Aggiornamento&utm_medium=email&utm_id=10" 
       style="background:#28a745; color:white; padding:14px 24px; border-radius:6px; text-decoration:none; font-size:16px; display:inline-block;">
       SCOPRI IL PRODOTTO
    </a>
  </p>

<hr style="margin:30px 0;">

<!-- SITO WEB -->
<h3 style="color:#333;">🌐 Visita il sito ufficiale</h3>
<p style="color:#444;">
  Puoi trovare tutti i nostri contenuti, aggiornamenti e prodotti direttamente sul sito ufficiale.
</p>

<p style="text-align:left;">
  <a href="https://www.mewingmarket.it?utm_source=brevo&utm_campaign=Aggiornamento&utm_medium=email&utm_id=10" 
     style="background:#007bff; color:white; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
     Vai al sito
  </a>
</p>

<hr style="margin:30px 0;">

<!-- SOCIAL -->
<h3 style="color:#333;">📱 Seguici sui social</h3>
<p style="color:#444;">Clicca sulle icone per raggiungerci:</p>

<div style="text-align:left;">
  ${generateSocialIcons()}
</div>

<hr style="margin:30px 0;">

<!-- FOOTER -->
<p style="font-size:14px; color:#777; text-align:center;">
  Se non vuoi più ricevere email, puoi disiscriverti qui:<br>
  <a href="https://mewingmarket.it/disiscriviti.html?utm_source=brevo&utm_campaign=Aggiornamento&utm_medium=email&utm_id=10" style="color:#999; text-decoration:underline;">Disiscriviti</a>
</p>

</div>
<p style="font-size:12px; color:#555555; margin:0; line-height:1.4;">
  &copy; 2025 <strong>MewingMarket</strong> &mdash; Prodotti digitali creati con Intelligenza Artificiale.<br>
  Tutti i diritti riservati.
</p>
</body>
</html>
`;

  return { html, oggetto };
}

function generateSocialIcons() {
  const socials = [
    ["Facebook", "https://www.facebook.com/profile.php?id=61584779793628", "https://cdn-icons-png.flaticon.com/512/733/733547.png"],
    ["Threads", "https://www.threads.com/@mewingmarket", "https://cdn-icons-png.flaticon.com/512/11428/11428186.png"],
    ["Instagram", "https://www.instagram.com/mewingmarket", "https://cdn-icons-png.flaticon.com/512/2111/2111463.png"],
    ["TikTok", "https://www.tiktok.com/@mewingmarket", "https://cdn-icons-png.flaticon.com/512/3046/3046121.png"],
    ["X", "https://x.com/mewingm8", "https://cdn-icons-png.flaticon.com/512/5968/5968958.png"],
    ["YouTube", "https://www.youtube.com/@mewingmarket2", "https://cdn-icons-png.flaticon.com/512/1384/1384060.png"],
    ["LinkedIn", "https://www.linkedin.com/in/simone-griseri-5368a7394", "https://cdn-icons-png.flaticon.com/512/3536/3536505.png"],
    ["WhatsApp", "https://wa.me/393520266660", "https://cdn-icons-png.flaticon.com/512/733/733585.png"]
  ];

  return socials.map(([name, url, icon]) =>
    `<a href="${url}?utm_source=brevo&utm_campaign=Aggiornamento&utm_medium=email&utm_id=10" target="_blank" style="margin-right:10px;">
      <img src="${icon}" width="32" style="vertical-align:middle;" alt="${name}">
    </a>`
  ).join("\n");
}

module.exports = { generateNewsletterHTML };
