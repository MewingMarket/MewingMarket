/**
 * =========================================================
 * File: app/modules/sitemap-youtube.cjs
 * Sitemap YouTube basata su tabella prodotti (SQL)
 * =========================================================
 */

const db = require("../db/database.cjs");

function generateYouTubeSitemap() {
  try {
    const stmt = db.prepare(`
      SELECT youtube_url
      FROM prodotti
      WHERE youtube_url IS NOT NULL
        AND youtube_url != ''
      ORDER BY id DESC
    `);

    const rows = stmt.all();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    rows.forEach(r => {
      xml += `
  <url>
    <loc>${r.youtube_url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("❌ Errore generateYouTubeSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateYouTubeSitemap };
