/* =========================================================
   FILE: app/server/routes/sitemap.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Sitemap dinamica basata sui prodotti (SQL)
========================================================= */

const path = require("path");

// require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");

/* =========================================================
   FUNZIONE PRINCIPALE — sitemap()
========================================================= */
async function sitemap() {
  console.log("[DEBUG sitemap] sitemap() chiamato");

  try {
    const stmt = db.prepare(`
      SELECT id
      FROM prodotti
      ORDER BY id DESC
    `);

    const prodotti = stmt.all();

    const urls = prodotti
      .map((p) => {
        const id = p.id;
        return `
  <url>
    <loc>https://mewingmarket.com/prodotto/${id}</loc>
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

    if (typeof global.logEvent === "function") {
      global.logEvent("sitemap_generated", { count: prodotti.length });
    }

    return {
      success: true,
      contentType: "application/xml",
      body: xml
    };

  } catch (err) {
    console.error("❌ Errore sitemap:", err);

    if (typeof global.logEvent === "function") {
      global.logEvent("sitemap_error", { error: err?.message || "unknown" });
    }

    return {
      success: false,
      contentType: "text/plain",
      body: "Errore generazione sitemap"
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (ex GET /sitemap.xml)
========================================================= */
async function sitemapXml(req) {
  console.log("[DEBUG sitemap] alias sitemapXml() → sitemap()");
  return sitemap(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  sitemap,
  sitemapXml
};
