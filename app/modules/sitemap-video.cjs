/**
 * =========================================================
 * File: app/modules/sitemap-video.cjs
 * Google Video Sitemap basata su tabella prodotti (SQL)
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluto
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

function escapeCDATA(str) {
  if (!str) return "";
  return str.replace(/]]>/g, "]]]]><![CDATA[>");
}

function generateVideoSitemap() {
  try {
    const stmt = db.prepare(`
      SELECT 
        youtube_url,
        youtube_title,
        youtube_thumbnail,
        descrizione_breve,
        descrizione_lunga
      FROM prodotti
      WHERE youtube_url IS NOT NULL
        AND youtube_url != ''
      ORDER BY id DESC
    `);

    const rows = stmt.all();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                   xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

    rows.forEach(p => {
      const url = p.youtube_url;
      const thumb = p.youtube_thumbnail || "";
      const title = escapeCDATA(p.youtube_title || "");
      const desc = escapeCDATA(p.descrizione_breve || p.descrizione_lunga || "");

      xml += `
  <url>
    <loc>${url}</loc>
    <video:video>
      <video:content_loc>${url}</video:content_loc>
      <video:player_loc>${url}</video:player_loc>
      <video:title><![CDATA[${title}]]></video:title>
      <video:description><![CDATA[${desc}]]></video:description>
      ${thumb ? `<video:thumbnail_loc>${thumb}</video:thumbnail_loc>` : ""}
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("❌ Errore generateVideoSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateVideoSitemap };
