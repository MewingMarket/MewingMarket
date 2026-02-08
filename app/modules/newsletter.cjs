// modules/newsletter-mindset.cjs

const { getProducts } = require("./airtable");

function generateMindsetNewsletter() {
  const products = getProducts();
  const latest = products.at(-1);

  if (!latest) {
    return {
      oggetto: "Novità dal mondo digitale",
      html: "<p>Nessun prodotto disponibile.</p>"
    };
  }

  const titolo = latest.titoloBreve || latest.titolo;
  const descrizione = latest.descrizioneBreve || latest.descrizione || "";
  const immagine = latest.immagine;
  const link = latest.linkPayhip;

  const oggetto = `✨ Novità: è arrivato “${titolo}”`;

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

  <!-- INTRO POTENTE -->
  <h2 style="text-align:center; color:#333;">✨ Una novità che ti porta un passo avanti</h2>

  <p style="font-size:16px; color:#444;">
    Ogni giorno hai due scelte: restare dove sei o fare un passo in avanti.  
    Non serve fare salti enormi: basta una sola decisione fatta bene.
  </p>

  <p style="font-size:16px; color:#444;">
    Per questo oggi ti presento qualcosa che può davvero spostarti in avanti, senza complicazioni e senza perdere tempo.
  </p>

  <!-- BLOCCO NOVITÀ -->
  <h2 style="text-align:center; color:#333; margin-top:35px;">🔥 È arrivato “${titolo}”</h2>

  <p style="font-size:16px; color:#444;">
    ${descrizione}
  </p>

  <div style="text-align:center; margin:25px 0;">
    <img src="${immagine}" 
         alt="${titolo}" 
         style="max-width:100%; border-radius:6px;">
  </div>

  <!-- CTA -->
  <p style="text-align:center;">
    <a href="${link}?utm_source=brevo&utm_campaign=novita&utm_medium=email" 
       style="background:#28a745; color:white; padding:14px 24px; border-radius:6px; text-decoration:none; font-size:16px; display:inline-block;">
       SCOPRI IL NUOVO CONTENUTO
    </a>
  </p>

  <hr style="margin:30px 0;">

  <!-- BLOCCO MENTALE (senza dire “mindset”) -->
  <h3 style="color:#333;">🎯 Perché questo contenuto può fare la differenza</h3>

  <p style="font-size:16px; color:#444;">
    La verità è semplice: chi ottiene risultati non è chi sa di più,  
    ma chi riesce a trasformare ciò che sa in azioni concrete.
  </p>

  <p style="font-size:16px; color:#444;">
    “${titolo}” è stato creato proprio per questo:  
    darti un vantaggio reale, immediato e applicabile.  
    Senza confusione. Senza perdere tempo. Senza complicazioni inutili.
  </p>

  <!-- CTA 2 -->
  <p style="text-align:center; margin-top:25px;">
    <a href="${link}?utm_source=brevo&utm_campaign=novita&utm_medium=email" 
       style="background:#007bff; color:white; padding:12px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
       VAI AL PRODOTTO
    </a>
  </p>

  <hr style="margin:30px 0;">

  <!-- SOCIAL -->
  <h3 style="color:#333;">📱 Seguici sui social</h3>
  <p style="color:#444;">Contenuti quotidiani, zero fuffa:</p>

  <div style="text-align:left;">
    ${generateSocialIcons()}
  </div>

  <hr style="margin:30px 0;">

  <!-- FOOTER -->
  <p style="font-size:14px; color:#777; text-align:center;">
    Se non vuoi più ricevere email, puoi disiscriverti qui:<br>
    <a href="https://mewingmarket.it/disiscriviti.html" style="color:#999; text-decoration:underline;">Disiscriviti</a>
  </p>

</div>
</body>
</html>
`;

  return { html, oggetto };
}

function generateSocialIcons() {
  const socials = [
    ["Instagram", "https://www.instagram.com/mewingmarket", "https://cdn-icons-png.flaticon.com/512/2111/2111463.png"],
    ["TikTok", "https://www.tiktok.com/@mewingmarket", "https://cdn-icons-png.flaticon.com/512/3046/3046121.png"],
    ["YouTube", "https://www.youtube.com/@mewingmarket2", "https://cdn-icons-png.flaticon.com/512/1384/1384060.png"],
    ["X", "https://x.com/mewingm8", "https://cdn-icons-png.flaticon.com/512/5968/5968958.png"]
  ];

  return socials.map(([name, url, icon]) =>
    `<a href="${url}" target="_blank" style="margin-right:10px;">
      <img src="${icon}" width="32" style="vertical-align:middle;" alt="${name}">
    </a>`
  ).join("\n");
}

module.exports = { generateMindsetNewsletter };
