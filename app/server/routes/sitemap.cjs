/**
 * =========================================================
 * File: app/server/routes/sitemap.cjs
 * Sitemap dinamica basata sui prodotti (SQL)
 * =========================================================
 */

const db = require("../db/database.cjs");

module.exports = function (app) {
  app.get("/sitemap.xml", (req, res) => {
    try {
      // Recupera tutti i prodotti dal DB
      const stmt = db.prepare(`
        SELECT slug
        FROM prodotti
        ORDER BY id DESC
      `);

      const prodotti = stmt.all();

      const urls = prodotti
        .map((p) => {
          const slug = p.slug;
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
