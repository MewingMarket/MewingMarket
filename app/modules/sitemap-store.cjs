// modules/sitemap-store.cjs — VERSIONE BLINDATA

const path = require("path");
const { getProducts } = require(path.join(__dirname, "airtable.cjs"));
const { cleanURL } = require("./utils.cjs");

/* =========================================================
   GENERA SITEMAP STORE (blindata)
========================================================= */
function generateStoreSitemap() {
  try {
    let products = [];

    // Caricamento sicuro
    try {
      const p = getProducts();
      products = Array.isArray(p) ? p : [];
    } catch (err) {
      console.error("sitemap-store: errore getProducts:", err);
      products = [];
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    products.forEach(p => {
      const url = cleanURL(p?.linkPayhip);
      if (!url) return; // evita URL rotti

      xml += `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("Errore generateStoreSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateStoreSitemap };
