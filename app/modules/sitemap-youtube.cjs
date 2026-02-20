// modules/sitemap-youtube.cjs — VERSIONE BLINDATA

const { getProducts } = require("./airtable.cjs");
const { cleanURL, safeText } = require("./utils.cjs");

/* =========================================================
   GENERA SITEMAP YOUTUBE (blindata)
========================================================= */
function generateYouTubeSitemap() {
  try {
    const products = Array.isArray(getProducts()) ? getProducts() : [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    products.forEach(p => {
      const url = cleanURL(p?.youtube_last_video_url || p?.youtube_url);
      if (!url) return;

      xml += `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("Errore generateYouTubeSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateYouTubeSitemap };
