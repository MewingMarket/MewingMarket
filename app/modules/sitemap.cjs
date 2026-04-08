// modules/sitemap.cjs — VERSIONE BLINDATA (SQL)

const path = require("path");

// PATCH: catalogo SQL, non Airtable
const { getAllProducts } = require(path.join(process.cwd(), "app/modules/catalogo-sql.cjs"));
const { safeText, cleanURL } = require(path.join(process.cwd(), "app/modules/utils.cjs"));

/* =========================================================
   GENERA SITEMAP COMPLETA (blindata)
========================================================= */
function generateSitemap() {
  try {
    const base = "https://www.mewingmarket.it";

    const staticPages = [
      "",
      "/catalogo",
      "/privacy",
      "/termini"
    ];

    /* =====================================================
       CARICAMENTO PRODOTTI (SQL)
    ====================================================== */
    let products = [];
    try {
      const p = getAllProducts();
      products = Array.isArray(p) ? p : [];
    } catch (err) {
      console.error("sitemap: errore getAllProducts:", err);
      products = [];
    }

    /* =====================================================
       GENERAZIONE URL PRODOTTI (blindata)
       🔥 Usa ID numerico del catalogo SQL
    ====================================================== */
    const productUrls = products
      .map(p => p?.id)
      .filter(id => id && Number.isInteger(id))
      .map(id => `/prodotto/${id}`);

    const urls = [...staticPages, ...productUrls];

    /* =====================================================
       COSTRUZIONE XML (blindata)
    ====================================================== */
    const xml = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(u => {
    const loc = cleanURL(`${base}${safeText(u)}`);
    if (!loc) return "";
    return `
  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
  </url>`;
  })
  .join("")}
</urlset>
`.trim();

    return xml;

  } catch (err) {
    console.error("Errore generateSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = {
  generateSitemap
};
