// modules/sitemap.cjs — VERSIONE BLINDATA

const path = require("path");
const { getProducts } = require(path.join(__dirname, "airtable-sync.cjs"));
const { safeText, cleanURL } = require("./utils.cjs");

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
       CARICAMENTO PRODOTTI SICURO
    ====================================================== */
    let products = [];
    try {
      const p = getProducts();
      products = Array.isArray(p) ? p : [];
    } catch (err) {
      console.error("sitemap: errore getProducts:", err);
      products = [];
    }

    /* =====================================================
       GENERAZIONE URL PRODOTTI (blindata)
       🔥 PATCH: rimosso slug → uso id
    ====================================================== */
    const productUrls = products
      .map(p => p?.id)
      .filter(id => id && typeof id === "string")
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
