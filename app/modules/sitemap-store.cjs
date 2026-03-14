/**
 * =========================================================
 * File: app/modules/sitemap-store.cjs
 * Sitemap prodotti per Google (SQL)
 * =========================================================
 */

const db = require("../db/database.cjs");

function generateStoreSitemap() {
  try {
    const stmt = db.prepare(`
      SELECT slug
      FROM prodotti
      WHERE slug IS NOT NULL
        AND slug != ''
      ORDER BY id DESC
    `);

    const rows = stmt.all();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    rows.forEach(p => {
      xml += `
  <url>
    <loc>https://mewingmarket.com/prodotto/${p.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("❌ Errore generateStoreSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateStoreSitemap };
