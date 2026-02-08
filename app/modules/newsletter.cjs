// modules/newsletter.js

const { getProducts } = require("./airtable");

function generateNewsletterHTML() {
  const products = getProducts();
  const latest = products.at(-1);

  if (!latest) return "<p>Nessun prodotto disponibile.</p>";

  const titolo = latest.titoloBreve || latest.titolo;
  const descrizione = latest.descrizioneBreve || latest.descrizione || "";
  const immagine = latest.immagine;
  const link = latest.linkPayhip;

  const oggetto = `🧠 È arrivato “${titolo}” — Scopri il nuovo contenuto digitale`;

  const html = `
  ... (identico al tuo, nessuna modifica necessaria)
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
