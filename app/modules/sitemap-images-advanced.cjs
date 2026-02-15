// modules/sitemap-images-advanced.cjs — VERSIONE AVANZATA

const { getProducts } = require("./airtable.cjs");
const { cleanURL, safeText } = require("./utils.cjs");

/* =========================================================
   GENERA SITEMAP IMMAGINI AVANZATA
========================================================= */
function generateAdvancedImagesSitemap() {
  try {
    const products = Array.isArray(getProducts()) ? getProducts() : [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                   xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    products.forEach(p => {
      const productUrl = cleanURL(`https://www.mewingmarket.it/prodotto.html?slug=${p.slug}`);
      if (!productUrl) return;

      xml += `
  <url>
    <loc>${productUrl}</loc>
`;

      // Immagine principale Payhip
      if (p.Immagine && Array.isArray(p.Immagine) && p.Immagine[0]?.url) {
        const img = cleanURL(p.Immagine[0].url);
        if (img) {
          xml += `
    <image:image>
      <image:loc>${img}</image:loc>
      <image:title><![CDATA[${safeText(p.titolo || "")}]]></image:title>
      <image:caption><![CDATA[${safeText(p.descrizioneBreve || "")}]]></image:caption>
    </image:image>`;
        }
      }

      // Thumbnail YouTube
      if (p.youtube_thumbnail) {
        const ytImg = cleanURL(p.youtube_thumbnail);
        if (ytImg) {
          xml += `
    <image:image>
      <image:loc>${ytImg}</image:loc>
      <image:title><![CDATA[${safeText(p.youtube_title || p.titolo || "")}]]></image:title>
      <image:caption><![CDATA[${safeText(p.youtube_description || "")}]]></image:caption>
    </image:image>`;
        }
      }

      xml += `
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("Errore generateAdvancedImagesSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateAdvancedImagesSitemap };
