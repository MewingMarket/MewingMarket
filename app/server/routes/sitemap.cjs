/**
 * app/server/routes/sitemap.cjs
 * Sitemap dinamica basata sui prodotti
 */

// PRODUCTS → percorso corretto (airtable.cjs)
const { getProducts } = require("../../modules/airtable.cjs");

module.exports = function (app) {
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const products = Array.isArray(getProducts()) ? getProducts() : [];

      const urls = products
        .map((p) => {
          const slug = p.slug || p.id;
          return `
    <url>
      <loc>https://mewingmarket.com/prodotto/${slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
        })
        .join("");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mewingmarket.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls}
</urlset>`;

      res.header("Content-Type", "application/xml");
      return res.send(xml);

    } catch (err) {
      console.error("❌ Errore sitemap:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("sitemap_error", { error: err?.message || "unknown" });
      }

      return res.status(500).send("Errore generazione sitemap");
    }
  });
};
