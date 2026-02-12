// SITEMAP IMMAGINI — MEWINGMARKET (blindata)

const { cleanURL, safeText } = require("./utils.cjs");

/* =========================================================
   GENERA SITEMAP IMMAGINI (blindata)
========================================================= */
function generateImagesSitemap() {
  try {
    const immagini = [
      "https://www.mewingmarket.it/img/logo.png",
      "https://www.mewingmarket.it/img/header.webp",
      "https://www.mewingmarket.it/img/catalogo.webp",
      "https://www.mewingmarket.it/img/faq.webp",
      "https://www.mewingmarket.it/img/contatti.webp",
      "https://www.mewingmarket.it/img/newsletter.webp"
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    immagini.forEach((rawUrl) => {
      const url = cleanURL(rawUrl);
      if (!url) return; // evita URL rotti

      xml += `  <url>\n`;
      xml += `    <loc>https://www.mewingmarket.it/</loc>\n`;
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${url}</image:loc>\n`;
      xml += `    </image:image>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;

  } catch (err) {
    console.error("Errore generateImagesSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateImagesSitemap };
